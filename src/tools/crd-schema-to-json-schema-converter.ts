import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { SchemaObject } from 'ajv';
import { JSONSchemaProps } from 'kubernetes-types/apiextensions/v1';

export class CrdSchemaToJsonSchemaConverter
{
    protected _logger : ILogger;

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('CrdSchemaToJsonSchemaConverter');
    }

    convert(crdSchema : JSONSchemaProps) : SchemaObject
    {
        const schema = this._convert(crdSchema);

        if (!schema.properties) {
            schema.properties = {}
        }

        schema.properties["apiVersion"] = {
            "type": "string"
        };

        schema.properties["kind"] = {
            "type": "string"
        };

        schema.properties["metadata"] = {
            "allOf": [{
                "$ref": "#/definitions/io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta"
            }],
            "default": {}
        };
        
        return schema;
    }

    private _convert(crdSchema : SchemaObject) : SchemaObject
    {
        const customFix = this._applyCustomFix(crdSchema);
        if (customFix) {
            return customFix;
        }

        const schema : SchemaObject = {
            type: crdSchema.type,
            format: crdSchema.format
        };

        if (crdSchema.properties) {
            schema.properties = this._convertProperties(crdSchema.properties);
        }

        crdSchema.items
        if (crdSchema.items) {
            schema.items = this._convert(crdSchema.items);
        }

        if (crdSchema.allOf) {
            schema.allOf = this._convertArray(crdSchema.allOf);
        }

        if (_.isNotNullOrUndefined(crdSchema.default))
        {
            schema.default = crdSchema.default;
        }

        if (_.isNotNullOrUndefined(crdSchema.required))
        {
            schema.required = crdSchema.required;
        }

        if (_.isNotNullOrUndefined(crdSchema.enum))
        {
            schema.enum = crdSchema.enum;
        }

        if (crdSchema.type === "object")
        {
            schema.additionalProperties = false;
            if (_.isNotNullOrUndefined(crdSchema.additionalProperties))
            {
                if (_.isBoolean(crdSchema.additionalProperties))
                {
                    schema.additionalProperties = crdSchema.additionalProperties;
                }
                else
                {
                    schema.additionalProperties = this._convert(crdSchema.additionalProperties as SchemaObject);
                }
            }
        }

        return schema;
    }


    private _convertProperties(properties: { [property: string]: SchemaObject }) : Record<string, SchemaObject>
    {
        const converted : Record<string, SchemaObject> = {};
        for(const name of _.keys(properties))
        {
            converted[name] = this._convert(properties[name]);
        }
        return converted;
    }

    private _convertArray(openApiSchemas: SchemaObject[]) : SchemaObject[]
    {
        return openApiSchemas.map(x => this._convert(x));
    }

    private _applyCustomFix(openApiSchema: SchemaObject) : SchemaObject | null
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
}
