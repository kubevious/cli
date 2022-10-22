import _ from 'the-lodash';
import { ILogger } from 'the-logger';

import Ajv, { Options as AjvOptions, ErrorObject } from "ajv";
import addFormats from "ajv-formats";

import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';
import { K8sOpenApiResource } from 'k8s-super-client';

import { K8sObject } from '../types/k8s';
import { parseApiVersion } from '../utils/k8s';

export interface K8sManifestValidatorParams
{
    ignoreUnknown? : boolean;
}

export class K8sManifestValidator
{
    private _logger: ILogger;
    private _k8sJsonSchema : K8sApiJsonSchema;
    private _params: K8sManifestValidatorParams;

    constructor(logger: ILogger, k8sJsonSchema : K8sApiJsonSchema, params?: K8sManifestValidatorParams)
    {
        this._logger = logger.sublogger('K8sManifestValidator');
        this._k8sJsonSchema = k8sJsonSchema;
        this._params = params || {};
    }

    validate(k8sManifest : K8sObject) : K8sManifestValidationResult
    {
        try
        {
            const apiResource = this._getApiResource(k8sManifest);
            this._logger.info("apiResource: ", apiResource);
            if (!apiResource) {
                return {
                    success: false,
                    errors: [ "Invalid manifest. Make sure that apiVersion and kind are set."]
                }
            }
    
            const resourceKey = _.stableStringify(apiResource);
            const definitionKey  = this._k8sJsonSchema.resources[resourceKey];
            this._logger.info("definitionKey: %s", definitionKey);
            if (!definitionKey) {
                const msg = `Unknown API Resource. apiVersion: ${k8sManifest.apiVersion}, kind: ${k8sManifest.kind}.`;
                if (this._params.ignoreUnknown) {
                    return {
                        success: true,
                        warnings: [ msg ]
                    }
                }
    
                return {
                    success: false,
                    errors: [ msg ]
                }
            }
    
            const schema = { // : SomeJTDSchemaType
                ['$ref'] : `#/definitions/${definitionKey}`,
                definitions: this._k8sJsonSchema.definitions
            }
    
            const ajvOptions: AjvOptions = {
                strict: true,
                discriminator: true,
                strictSchema: true,
                validateFormats: true,
                strictRequired: true,
                strictTypes: true,
                strictNumbers: true,
                formats: {
                }
            };
            const ajv = new Ajv(ajvOptions); 
            addFormats(ajv);
            const validator = ajv.compile(schema);
            const result = validator(k8sManifest);
            // this._logger.info("RESULT: ", result);
            // this._logger.info("ERRORS: ", validator.errors);
            if (result) {
                return {
                    success: true
                }
            } else {
                return {
                    success: false,
                    errors: (validator.errors ?? []).map(x => this._mapError(x))
                }
            }
        }
        catch(reason : any)
        {
            this._logger.info("[validate] Catch: ", reason);

            return {
                success: false,
                errors: [ reason?.message ?? 'Unkown Error.' ] 
            }
        }

    }

    private _mapError(error: ErrorObject)
    {
        if (error.keyword === 'type')
        {
            return `Invalid type under "${error.instancePath}". ${_.upperFirst(error.message)}.`;
        }
        if (error.keyword === 'additionalProperties')
        {
            return `Unknown property "${error.params.additionalProperty}" under "${error.instancePath}"`;
        }
        if (error.keyword === 'required')
        {
            return `Required property "${error.params.missingProperty}" missing under "${error.instancePath}"`;
        }
        if (error.keyword === 'enum')
        {
            const allowedValues = error.params?.allowedValues ?? [];
            return `Unknown enum value provided in "${error.instancePath}". Allowed values are: ${allowedValues.join(', ')}.`;
        }
        
        return error.message ?? 'unknown error';
    }

    private _getApiResource(k8sManifest : K8sObject) : K8sOpenApiResource | null
    {
        if (!k8sManifest.kind) {
            return null;
        }

        const apiVersionParts = parseApiVersion(k8sManifest.apiVersion);
        if (!apiVersionParts) {
            return null;
        }

        return {
            group: apiVersionParts.group,
            version: apiVersionParts.version,
            kind: k8sManifest.kind
        }
    }
}

export interface K8sManifestValidationResult
{
    success: boolean;
    errors?: string[];
    warnings?: string[];
}