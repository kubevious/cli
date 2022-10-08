import _ from 'lodash';
import { logger } from './logger';
// import OpenAPISchemaValidator from 'openapi-schema-validator';
import * as Path from 'path'
import * as fs from 'fs'
import { OpenApiValidator } from 'express-openapi-validate';

import Ajv, { Options as AjvOptions, ErrorObject } from "ajv";
import addFormats from "ajv-formats";


import { OpenAPIV3Parser } from './OpenAPIV3Parser';

// https://www.npmjs.com/package/openapi-types

logger.info("Starting Up...")

const OPEN_API_DOCUMENT_JSON = JSON.parse(fs.readFileSync('./data/my-schema.json').toString('utf8'));
const PAYLOAD_JSON = JSON.parse(fs.readFileSync('./data/payload.json').toString('utf8'));

const parser = new OpenAPIV3Parser(logger);
parser.load(OPEN_API_DOCUMENT_JSON);

const schema = parser.getSchema('io.k8s.api.core.v1.Service'); // Pod
if (!schema) {
    logger.error("COULD NOT GENERATE SCHEMA");
    throw new Error();
}
console.log("************************************************************************************************")
logger.info("schema: ", schema);
console.log("************************************************************************************************")
fs.writeFileSync('./data/json-schema.json', JSON.stringify(schema, null, 4));

// const schema = JSON.parse(fs.readFileSync('./data/sample-schema.json').toString('utf8'));

const ajvOptions: AjvOptions = {
    discriminator: true,
    formats: {
    }
};
const ajv = new Ajv(ajvOptions); 
addFormats(ajv);
const validator = ajv.compile(schema);
const result = validator(PAYLOAD_JSON);
logger.info("RESULT: ", result);
logger.info("ERRORS: ", validator.errors);