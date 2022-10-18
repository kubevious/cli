import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { K8sApiSchemaRegistry } from '../../tools/k8s-api-schema-registry';

import { KnownK8sVersionsResult } from './types';
import { output } from './output';

export default function (program: Command)
{
    program
        .command('list-known-k8s-versions')
        .description('List of known K8s versions')
        .option('--json', 'Output in JSON')
        .action(async (options) => {

            const k8sApiRegistry = new K8sApiSchemaRegistry(logger);
            k8sApiRegistry.init();
            
            const result: KnownK8sVersionsResult = {
                versions: k8sApiRegistry.getVersions()
            }

            if (options.json)
            {
                console.log(JSON.stringify(result, null, 4));
            }
            else
            {
                output(result);
            }

        });
}
