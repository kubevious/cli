import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';


import { CommandBuilder } from '../../infra/command-action';

import { KnownK8sVersionsResult } from './types';
import { output } from './output';
import { K8sApiSchemaRegistry } from '../../api-schema/k8s-api-schema-registry';

export default function (program: Command)
{
    program
        .command('list-known-k8s-versions')
        .description('List of known K8s versions')
        .option('--json', 'Output command result in JSON.')
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
