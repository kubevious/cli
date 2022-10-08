import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { OpenApiv3Document, OpenApiV3SchemaObject } from './open-api-v3';

import { SchemaObject } from 'ajv';

export interface JsonSchema {
    '$id': string,
    definitions: Record<string, any>
}

const ROOT_ID='http://k8s.io';

export class OpenAPIV3Parser
{
    private _logger: ILogger;

    private _definitions: Record<string, SchemaObject> = {};
    private _definitionsSchema : JsonSchema = {
        '$id': ROOT_ID,
        definitions: {}
    };

    constructor(logger: ILogger)
    {
        this._logger = logger;
    }

    load(openAPIDocument: OpenApiv3Document)
    {
        if (!openAPIDocument.components?.schemas) {
            return;
        }

        const schemaNames = _.keys(openAPIDocument.components?.schemas);

        for(const name of schemaNames)
        {
            this._logger.info("SCHEMA: %s", name);
            const openAPISchema = openAPIDocument.components?.schemas[name];
            this._loadSchema(name, openAPISchema);
        }
    }

    extractDefinitionsSchema()
    {
        return this._definitionsSchema;
    }

    getSchema(name: string) : SchemaObject | null
    {
        const schemaOrig = this._definitions[name];
        if (schemaOrig) {
            return {
                "$ref": `#/definitions/${name}`,
                definitions: this._definitions
            }
        }
        return null;
    }

    private _loadSchema(name: string, openApiSchema: OpenApiV3SchemaObject)
    {
        this._logger.info("[_loadSchema] openApiSchema: ", openApiSchema);

        const jsonSchema = this._convertSchema(openApiSchema);

        this._logger.info("[_loadSchema] jsonSchema: ", jsonSchema);

        this._definitions[name] = jsonSchema;
        this._definitionsSchema.definitions[name] = jsonSchema;
    }

    private _convertSchema(openApiSchema: OpenApiV3SchemaObject) : SchemaObject
    {
        const refValue = openApiSchema['$ref'];
        if (refValue) {
            return {
                '$ref': this._convertReference(refValue),
            }
        }

        const customFix = this._applyCustomFix(openApiSchema);
        if (customFix) {
            return customFix;
        }

        const schema : SchemaObject = {
            type: openApiSchema.type,
            format: openApiSchema.format
        };

        if (openApiSchema.properties) {
            schema.properties = this._convertProperties(openApiSchema.properties);
        }

        if (openApiSchema.items) {
            schema.items = this._convertSchema(openApiSchema.items);
        }

        if (openApiSchema.allOf) {
            schema.allOf = this._convertArray(openApiSchema.allOf);
        }

        if (_.isNotNullOrUndefined(openApiSchema.default))
        {
            schema.default = openApiSchema.default;
        }

        if (openApiSchema.type === "object")
        {
            schema.additionalProperties = false;
            if (_.isNotNullOrUndefined(openApiSchema.additionalProperties))
            {
                if (_.isBoolean(openApiSchema.additionalProperties))
                {
                    schema.additionalProperties = openApiSchema.additionalProperties;
                }
                else
                {
                    schema.additionalProperties = this._convertSchema(openApiSchema.additionalProperties as OpenApiV3SchemaObject);
                }
            }
        }

        return schema;
    }

    private _applyCustomFix(openApiSchema: OpenApiV3SchemaObject) : SchemaObject | null
    {
        if (openApiSchema.format === 'int-or-string') {
            return {
                oneOf: [
                    { type: "string" },
                    { type: "integer" }
                ]
            }
        }
        return null;
    }

    private _convertReference(origRef: string) : string
    {
        const prefix = "#/components/schemas/";
        if (_.startsWith(origRef, prefix)) {
            origRef = origRef.substr(prefix.length);
            return `#/definitions/${origRef}`;
        }
        return origRef;
    }

    private _convertProperties(properties: { [property: string]: OpenApiV3SchemaObject }) :  Record<string, SchemaObject>
    {
        const converted : Record<string, SchemaObject> = {};
        for(const name of _.keys(properties))
        {
            converted[name] = this._convertSchema(properties[name]);
        }
        return converted;
    }

    private _convertArray(openApiSchemas: OpenApiV3SchemaObject[]) : SchemaObject[]
    {
        return openApiSchemas.map(x => this._convertSchema(x));
    }

    
}
