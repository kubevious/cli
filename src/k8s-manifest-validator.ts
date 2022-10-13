import _ from 'the-lodash';
import { ILogger } from 'the-logger';

import Ajv, { Options as AjvOptions, ErrorObject } from "ajv";
import addFormats from "ajv-formats";

import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';
import { K8sOpenApiResource } from 'k8s-super-client';

import { K8sObject } from './k8s-types';
export class K8sManifestValidator
{
    private _logger: ILogger;
    private _k8sJsonSchema : K8sApiJsonSchema;

    constructor(logger: ILogger, k8sJsonSchema : K8sApiJsonSchema)
    {
        this._logger = logger;
        this._k8sJsonSchema = k8sJsonSchema;
    }

    validate(k8sManifest : K8sObject)
    {
        const apiResource = this._getApiResource(k8sManifest);
        this._logger.info("apiResource: ", apiResource);

        const resourceKey  = this._k8sJsonSchema.resources[_.stableStringify(apiResource)];
        this._logger.info("resourceKey: %s", resourceKey);

        const schema = { // : SomeJTDSchemaType
            ['$ref'] : `#/definitions/${resourceKey}`,
            definitions: this._k8sJsonSchema.definitions
        }

        const ajvOptions: AjvOptions = {
            discriminator: true,
            formats: {
            }
        };
        const ajv = new Ajv(ajvOptions); 
        addFormats(ajv);
        const validator = ajv.compile(schema);
        const result = validator(k8sManifest);
        this._logger.info("RESULT: ", result);
        this._logger.info("ERRORS: ", validator.errors);
    }

    private _getApiResource(k8sManifest : K8sObject) : K8sOpenApiResource
    {
        const parts = k8sManifest.apiVersion.split('/');
        if (parts.length === 1) {
            return {
                group: '',
                version: parts[0],
                kind: k8sManifest.kind
            }
        }
        if (parts.length === 2) {
            return {
                group: parts[0],
                version: parts[1],
                kind: k8sManifest.kind
            }
        }

        throw new Error("Invalid Manifest");
    }
}
