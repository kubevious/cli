import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../../logger';

import { CommandBuilder } from '../../../infra/command-action';

import { command } from '../command';
import { formatResult } from '../format';
import { output } from '../output';
import { InstallHookCommandData } from '../types';

const HOOK_ID = 'kubevious-lint';

export default function (program: Command)
{
    program
        .command('lint')
        .description('Installs a Git pre-commit hook to Lint Kubernetes Manifests')
        .argument('[path]', 'Path to git repository')
        .option('--json', 'Output command result in JSON.')
        .action(
            new CommandBuilder<InstallHookCommandData, InstallHookCommandData>()
                .perform(async (path?: string) => {

                    return command(path, { hook: HOOK_ID })
                })
                .format(formatResult)
                .output(output)
                .build()
        
        );
}
