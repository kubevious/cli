import 'mocha';
import should = require('should');

import _ from 'the-lodash';

import { sanitizeYaml } from '../src/utils/k8s-manifest-sanitizer';

import { logger } from './utils/logger';

describe('helper-k8s-manifest-sanitizer', function() {

    it('case-01', function() {
        const manfiest = {
            apiVersion: "apps/v1",
            kind: "Deployment",
            spec: {
                replicas: 1,
                template: {
                    containers: [
                        {
                            name: "test",
                            volumes: [
                              {
                                name: "datadir",
                                mountPath: "/bitnami/mongodb",
                                subPath: null
                              }
                            ]
                        }
                    ]
                }
            }
        };

        const result = sanitizeYaml(manfiest);
        logger.info("RESULT: ", result);
        should(result).be.ok();
        should(result.apiVersion).be.equal("apps/v1");
        should(result.spec?.replicas).be.equal(1);
        should(result.spec?.template?.containers[0].volumes[0].name).be.equal("datadir");
        should(result.spec?.template?.containers[0].volumes[0].subPath).be.undefined();
    });

});