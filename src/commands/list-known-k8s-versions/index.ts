import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { K8sApiSchemaRegistry } from '../../tools/k8s-api-schema-registry';

import { CommandBuilder } from '../../infra/command-action';

import { KnownK8sVersionsResult } from './types';
import { output } from './output';

export default function (program: Command)
{
    program
        .command('list-known-k8s-versions')
        .description('List of known K8s versions')
        .option('--json', 'Output in JSON')
        .action(
            new CommandBuilder<string[], KnownK8sVersionsResult>()
                .perform(async () => {

                    const k8sApiRegistry = new K8sApiSchemaRegistry(logger);
                    k8sApiRegistry.init();

                    return k8sApiRegistry.getVersions();
                })
                .format(versions => {
                    const result: KnownK8sVersionsResult = {
                        versions: versions
                    }
                    return result;
                })
                .output(output)
                .build()
        
        );
}
