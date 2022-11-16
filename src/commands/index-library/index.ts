import _ from 'the-lodash';
import { Command } from 'commander';
import { CommandBuilder } from '../../infra/command-action';

import { IndexLibraryCommandData, IndexLibraryCommandOptions, IndexLibraryResult } from './types';
import { command, massageIndexOptions } from './command';
import { formatResult } from './format';
import { output } from './output';

export default function (program: Command)
{
    program
        .command('index-library')
        .description('Generate index for rules library repository. Creates index.yaml file.')
        .argument('<dir>', 'Path to the repository which contiains Kubevious rules.')
        .option('--json', 'Output command result in JSON.')
        .action(

            new CommandBuilder<IndexLibraryCommandData, IndexLibraryResult>()
                .perform(async (dir: string, options: Partial<IndexLibraryCommandOptions>) => {

                    const myOptions = massageIndexOptions(options);

                    return command(dir, myOptions);
                    
                })
                .format(formatResult)
                .output(output)
                .decideSuccess(result => {
                    if (!result.success)
                    {
                        return 100;
                    }
                    return 0;
                })
                .build()            

        );
}
