import _ from 'the-lodash';
import { ILogger } from 'the-logger';

import Ajv, { Options as AjvOptions, ErrorObject } from "ajv";

import addFormats from "ajv-formats";

import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';

import { K8sObject } from '../types/k8s';
import { getApiResourceId, getJsonSchemaResourceKey } from '../utils/k8s';

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
            const apiResource = getApiResourceId(k8sManifest);
            if (!apiResource) {
                return {
                    success: false,
                    errors: [ "Invalid manifest. Make sure that apiVersion and kind are set."]
                }
            }
    
            const resourceKey = getJsonSchemaResourceKey(apiResource);
            this._logger.verbose('[validate] resourceKey: ', resourceKey);

            const resourceInfo = this._k8sJsonSchema.resources[resourceKey];
            this._logger.verbose('[validate] resourceInfo: ', resourceInfo);

            if (!resourceInfo) {
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
                ['$ref'] : `#/definitions/${resourceInfo.definitionId}`,
                definitions: this._k8sJsonSchema.definitions
            }

            this._logger.verbose('[validate] %s', resourceInfo.definitionId);

            this._preProcessNode(k8sManifest, {
                ['$ref'] : schema['$ref']
            }, null, null);
            // this._logger.info("PreProcessed Manifest: ", k8sManifest);
    
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

    private _preProcessNode(node: any, schema: any, parentNode: any, parentProp: any) : void
    {
        // this._logger.info('[_preProcessNode] ')
        if (!schema) {
            return;
        }

        {
            const refName = schema['$ref'];
            if (refName)
            {
                return this._preProcessNodeRef(node, refName, parentNode, parentProp);
            }
        }

        {
            const allOf = schema.allOf;
            if (allOf)
            {
                const firstSchema = _.first(allOf);
                return this._preProcessNode(node, firstSchema, parentNode, parentProp);
            }
        }

        const sType = schema.type;
        // this._logger.info('[_preProcessNode] type: %s', sType)

        if (sType === 'object')
        {
            if (_.isNull(node))
            {
                // this._logger.error(">>>>>> OBJECT IS NULL");
                if (parentNode) {
                    parentNode[parentProp] = {};
                }
            }
            else if (_.isObject(node)) {
                if (schema.properties)
                {
                    this._preProcessClearEmptyRequiredStrings(node, schema);

                    for(const propName of _.keys(node))
                    {
                        // this._logger.info('[_preProcessNode] propName: %s', propName)
                        const propNode = (node as any)[propName];

                        const propSchema = schema.properties[propName];
                        if (propSchema)
                        {
                            this._preProcessNode(propNode, propSchema, node, propName);
                        }
                        // this._logger.info('[_preProcessNode] propNode: ', propNode)
                    }
                }
            }
        }
        else if (sType === 'array')
        {
            const itemsSchema = schema.items;
            if (_.isNull(node))
            {
                // this._logger.error(">>>>>> ARRAY IS NULL");
                if (parentNode) {
                    parentNode[parentProp] = [];
                }
            }
            else if (_.isArray(node))
            {
                for(const childNode of node)
                {
                    this._preProcessNode(childNode, itemsSchema, null, null);
                }
            }
        }

    }

    private _preProcessClearEmptyRequiredStrings(node: any, schema: any) : void
    {
        if (schema.required) {
            for(const propName of schema.required) {
                const propSchema = schema.properties[propName];
                if (propSchema && 
                    propSchema.type == "string")
                {
                    const propNode = (node as any)[propName];
                    if (_.isString(propNode) && (propNode.length === 0))
                    {
                        if (_.isNotNullOrUndefined(propSchema.default))
                        {
                            delete (node as any)[propName];
                        }
                        else
                        {
                            (node as any)[propName] = propSchema.default;
                        }
                    }
                }
            }
        }
    }

    private _preProcessNodeRef(node: any, refName: string, parentNode: any, parentProp: any) : void
    {
        // this._logger.info('[_preProcessNodeRef] refName: %s', refName);

        const prefix = '#/definitions/';
        if (_.startsWith(refName, prefix))
        {
            const key = refName.substring(prefix.length);
            // this._logger.info('[_preProcessNodeRef] key: %s', key);
            const refSchema = this._k8sJsonSchema.definitions[key];
            // this._logger.info('[_preProcessNodeRef] refSchema: ', refSchema);
            return this._preProcessNode(node, refSchema, parentNode, parentProp);
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
            if (error.instancePath) {
                return `Unknown property "${error.params.additionalProperty}" under "${error.instancePath}"`;
            }
            return `Unknown property "${error.params.additionalProperty}"`;
        }
        if (error.keyword === 'required')
        {
            if (error.instancePath) {
                return `Required property "${error.params.missingProperty}" missing under "${error.instancePath}"`;
            }
            return `Required property "${error.params.missingProperty}" missing.`;
        }
        if (error.keyword === 'enum')
        {
            const allowedValues = error.params?.allowedValues ?? [];
            return `Unknown enum value provided in "${error.instancePath}". Allowed values are: ${allowedValues.join(', ')}.`;
        }
        
        return error.message ?? 'unknown error';
    }

}

export interface K8sManifestValidationResult
{
    success: boolean;
    errors?: string[];
    warnings?: string[];
}