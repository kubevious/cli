import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { CustomResourceDefinition } from 'kubernetes-types/apiextensions/v1'

import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';

import { K8sManifest, ManifestPackage } from './manifest-package';
import { K8sManifestValidator } from './k8s-manifest-validator';
import { ISpinner, spinOperation } from '../utils/screen';
import { isCRD } from '../utils/k8s';
import { SchemaObject } from 'ajv/dist/core';
import { K8sOpenApiResource } from 'k8s-super-client';

export interface K8sPackageValidatorParams
{
    ignoreUnknown? : boolean;
}

export class K8sPackageValidator
{
    private _logger: ILogger;
    private _k8sJsonSchema : K8sApiJsonSchema;
    private _params: K8sPackageValidatorParams;
    private _spinner? : ISpinner;

    constructor(logger: ILogger, k8sJsonSchema : K8sApiJsonSchema, params?: K8sPackageValidatorParams)
    {
        this._logger = logger.sublogger('K8sPackageValidator');
        this._k8sJsonSchema = k8sJsonSchema;
        this._params = params || {};
    }

    validate(manifestPackage : ManifestPackage)
    {
        this._spinner = spinOperation('Validating manifests...');

        this._applyCRDs(manifestPackage);

        return Promise.serial(manifestPackage.manifests, x => this._validateManifest(manifestPackage, x))
            .then(() => {
                this._spinner!.complete('Validation complete.')
            });
    }

    private _applyCRDs(manifestPackage : ManifestPackage)
    {
        const crds = manifestPackage.manifests.filter(x => isCRD(x.id));
        for(const crd of crds)
        {
            this._applyCRD(crd);
        }
    }

    private _applyCRD(crdManifest : K8sManifest)
    {
        this._logger.info('[_applyCRDs] ', crdManifest.id);

        const crd = crdManifest.config as CustomResourceDefinition;

        for(const versionSpec of (crd.spec.versions ?? []))
        {
            if (versionSpec.served)
            {
                const spec = versionSpec.schema?.openAPIV3Schema;
                if (spec)
                {
                    this._applyVersion(crd.spec.group, versionSpec.name, crd.spec.names.kind, spec);
                }
            }
        }
    }

    private _applyVersion(group: string, version: string, kind: string, schema : SchemaObject)
    {
        let parts = group.split('.');
        parts = _.reverse(parts);
        parts.push(version);
        parts.push(kind);

        const definitionKey = parts.join('.');
        this._logger.info('[_applyVersion] definitionKey: %s', definitionKey);

        const apiResource : K8sOpenApiResource = {
            group: group,
            kind: kind,
            version: version,
        }
        const resourceKey = _.stableStringify(apiResource);

        this._logger.info('[_applyVersion] apiResource: ', apiResource);
        this._logger.info('[_applyVersion] resourceKey: %s', resourceKey);

        this._k8sJsonSchema.definitions[definitionKey] = schema;
        this._k8sJsonSchema.resources[resourceKey] = definitionKey;
    }

    private _validateManifest(manifestPackage : ManifestPackage, manifest: K8sManifest)
    {
        if (!manifest.source.success)
        {
            return;
        }

        this._spinner!.update(`Validating ${manifest.source.source.path}...`);

        try
        {
            const validator = new K8sManifestValidator(this._logger, this._k8sJsonSchema, this._params);
            const result = validator.validate(manifest.config);
            if (!result.success)
            {
                this._logger.verbose("ERRORS: ", result.errors!);

                manifestPackage.manifestErrors(manifest, result.errors!);
            }
            manifestPackage.manifestWarnings(manifest, result.warnings);
        }
        catch(reason: any)
        {
            this._logger.error("[validate] ERROR: ", reason);

            manifestPackage.sourceError(manifest.source, `Unknown error occured. ${reason?.message}`);
        }
    }
}