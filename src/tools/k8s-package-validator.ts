import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { CustomResourceDefinition, JSONSchemaProps } from 'kubernetes-types/apiextensions/v1'

import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';

import { K8sManifest, ManifestPackage } from './manifest-package';
import { K8sManifestValidator } from './k8s-manifest-validator';
import { ISpinner, spinOperation } from '../utils/screen';
import { isCRD } from '../utils/k8s';
import { SchemaObject } from 'ajv/dist/core';
import { K8sOpenApiResource } from 'k8s-super-client';
import { CrdSchemaToJsonSchemaConverter } from './crd-schema-to-json-schema-converter';

export interface K8sPackageValidatorParams
{
    skipApplyCrds?: boolean
    ignoreUnknown? : boolean;
}

export class K8sPackageValidator
{
    private _logger: ILogger;
    private _origK8sJsonSchema : K8sApiJsonSchema;
    private _k8sJsonSchema : K8sApiJsonSchema;
    private _manifestPackage : ManifestPackage;
    private _params: K8sPackageValidatorParams;
    private _spinner? : ISpinner;

    constructor(logger: ILogger, k8sJsonSchema : K8sApiJsonSchema, manifestPackage : ManifestPackage, params?: K8sPackageValidatorParams)
    {
        this._logger = logger.sublogger('K8sPackageValidator');
        this._origK8sJsonSchema = k8sJsonSchema;
        this._manifestPackage = manifestPackage;
        this._params = params || {};
        this._k8sJsonSchema = this._makeSchemaClone();
    }

    validate()
    {
        this._spinner = spinOperation('Validating manifests...');

        return Promise.resolve()
            .then(() => {
                if (!this._params!.skipApplyCrds) {
                    this._logger.info("[validate] Running CRD Application...")
                    return this._applyCRDs();
                }
            })
            .then(() => {
                this._logger.info("[validate] Running Manifest Validation...")

                return Promise.serial(this._manifestPackage.manifests, x => this._validateManifest(x))
                    .then(() => {
                        this._spinner!.complete('Validation complete.')
                    });
            })


    }

    private _applyCRDs()
    {
        const crds = this._manifestPackage.manifests.filter(x => isCRD(x.id));

        return Promise.serial(crds, x => this._applyCRD(x))
    }

    private _applyCRD(crdManifest : K8sManifest)
    {
        this._logger.info('[_applyCRD] ', crdManifest.id);

        if (this._isValidCRD(crdManifest))
        {
            this._applyCRDToSchema(crdManifest, this._k8sJsonSchema);
        }
    }

    private _applyCRDToSchema(crdManifest : K8sManifest, jsonSchema : K8sApiJsonSchema)
    {
        this._logger.info('[_applyCRDToSchema] ', crdManifest.id);

        const crd = crdManifest.config as CustomResourceDefinition;

        for(const versionSpec of (crd.spec.versions ?? []))
        {
            if (versionSpec.served)
            {
                const spec = versionSpec.schema?.openAPIV3Schema;
                if (spec)
                {
                    this._applyCRDVersion(crd.spec.group, versionSpec.name, crd.spec.names.kind, spec, jsonSchema);
                }
            }
        }
    }

    private _isValidCRD(crdManifest: K8sManifest)
    {
        this._validateManifest(crdManifest);
        return crdManifest.success;
    }

    private _applyCRDVersion(group: string, version: string, kind: string, crdSchema : JSONSchemaProps, jsonSchema : K8sApiJsonSchema)
    {
        const apiResource : K8sOpenApiResource = {
            group: group,
            kind: kind,
            version: version,
        }
        this._logger.info('[_applyCRDToSchema] apiResource: ', apiResource);

        let parts = group.split('.');
        parts = _.reverse(parts);
        parts.push(version);
        parts.push(kind);

        const definitionKey = parts.join('.');
        this._logger.info('[_applyCRDToSchema] definitionKey: %s', definitionKey);

        const resourceKey = _.stableStringify(apiResource);

        this._logger.info('[_applyCRDToSchema] apiResource: ', apiResource);
        this._logger.info('[_applyCRDToSchema] resourceKey: %s', resourceKey);

        jsonSchema.definitions[definitionKey] = this._convertCrdSchemaToJsonSchema(crdSchema);
        jsonSchema.resources[resourceKey] = definitionKey;
    }

    private _convertCrdSchemaToJsonSchema(crdSchema : JSONSchemaProps)
    {
        const converter = new CrdSchemaToJsonSchemaConverter(this._logger);
        return converter.convert(crdSchema);
    }

    private _validateManifest(manifest: K8sManifest)
    {
        if (!manifest.source.success)
        {
            return;
        }

        if (manifest.isProcessed) {
            return;
        }

        manifest.isProcessed = true;

        this._spinner!.update(`Validating ${manifest.source.source.path}...`);

        {
            const jsonSchema = isCRD(manifest.id) ? this._origK8sJsonSchema : this._k8sJsonSchema;
            const validator = new K8sManifestValidator(this._logger, jsonSchema, this._params);
            const result = validator.validate(manifest.config);
            if (!result.success)
            {
                this._logger.verbose("ERRORS: ", result.errors!);
                this._manifestPackage.manifestErrors(manifest, result.errors!);
            }
            this._manifestPackage.manifestWarnings(manifest, result.warnings);
        }

        if (isCRD(manifest.id))
        {
            const newJsonSchema = this._makeSchemaClone();
            this._applyCRDToSchema(manifest, newJsonSchema);

            const validator = new K8sManifestValidator(this._logger, newJsonSchema, this._params);
            const result = validator.validate(manifest.config);
            this._logger.info("[_validateManifest] isCRD success: %s", result.success);

            if (!result.success)
            {
                this._logger.verbose("[_validateManifest] isCRD ERRORS: ", result.errors!);
                this._manifestPackage.manifestErrors(manifest, result.errors!);
            }
            this._manifestPackage.manifestWarnings(manifest, result.warnings);
        }
    }

    private _makeSchemaClone()
    {
        const newSchema : K8sApiJsonSchema = {
            resources: _.clone(this._origK8sJsonSchema.resources),
            definitions: _.clone(this._origK8sJsonSchema.definitions)
        }
        return newSchema;
    }
}