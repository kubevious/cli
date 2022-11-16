import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../../logger';


import { CommandBuilder } from '../../../infra/command-action';

import { output } from './output';

export default function (program: Command)
{
    program
        .command('rule-library')
        .description('Installs a Git pre-commit hook to index rules library')
        .argument('[path]', 'Path to git repository')
        .action(
            (...args: any[]) => {

                logger.info("ARGS: ", args);
            }
            // new CommandBuilder<string[], KnownK8sVersionsResult>()
            //     .perform(async () => {

            //         const k8sApiRegistry = new K8sApiSchemaRegistry(logger);
            //         k8sApiRegistry.init();

            //         return k8sApiRegistry.getVersions();
            //     })
            //     .format(versions => {
            //         const result: KnownK8sVersionsResult = {
            //             versions: versions
            //         }
            //         return result;
            //     })
            //     .output(output)
            //     .build()
        
        );
}
