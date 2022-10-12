import _ from 'the-lodash';
import { logger } from './logger';
import * as fs from 'fs'

import { K8sApiSchemaRegistry } from './k8s-api-schema-registry';

import { K8sManifestValidator } from './k8s-manifest-validator';

// https://www.npmjs.com/package/openapi-types

logger.info("Starting Up...")

const k8sApiRegistry = new K8sApiSchemaRegistry(logger);
k8sApiRegistry.init();

const k8sJsonSchema = k8sApiRegistry.getVersionSchema('v1.25.2');


{
    const PAYLOAD_JSON = JSON.parse(fs.readFileSync('./data/payload-pod.json').toString('utf8'));
    const validator = new K8sManifestValidator(logger, k8sJsonSchema);
    validator.validate(PAYLOAD_JSON);
}


{
    const PAYLOAD_JSON = JSON.parse(fs.readFileSync('./data/payload-service.json').toString('utf8'));
    const validator = new K8sManifestValidator(logger, k8sJsonSchema);
    validator.validate(PAYLOAD_JSON);
}