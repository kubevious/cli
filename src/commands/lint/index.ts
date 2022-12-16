import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { CommandBuilder } from '../../infra/command-action';
import { LintCommandData, LintCommandOptions, LintManifestsResult } from './types';

import { command, massageLintOptions } from './command';
import { formatResult } from './format';
import { output } from './output';

import { DESCRIPTION, OPTION_IGNORE_FILE, SUMMARY } from './docs';
import { ARG_PATH, OPTION_DETAILED, OPTION_IGNORE_NON_K8S, OPTION_IGNORE_UNKNOWN, OPTION_JSON, OPTION_K8S_VERSION, OPTION_KUBECONFIG, OPTION_LIVE_K8S, OPTION_SKIP_APPLY_CRDS, OPTION_STREAM } from './docs';

export default function (program: Command)
{
    program
        .command('lint')
        .summary(SUMMARY)
        .description(DESCRIPTION)
        .argument('[path...]', ARG_PATH)
        .option('--ignore-unknown', OPTION_IGNORE_UNKNOWN)
        .option('--ignore-non-k8s', OPTION_IGNORE_NON_K8S)
        .option('--skip-apply-crds', OPTION_SKIP_APPLY_CRDS)
        .option('--stream', OPTION_STREAM)
        .option('--k8s-version <version>', OPTION_K8S_VERSION)
        .option('--live-k8s', OPTION_LIVE_K8S)
        .option('--kubeconfig <path>', OPTION_KUBECONFIG)
        .option('--gitignore <path>', OPTION_IGNORE_FILE)
        .option('--detailed', OPTION_DETAILED)
        .option('--json', OPTION_JSON)
        .action(
            new CommandBuilder<LintCommandData, LintManifestsResult>()
                .perform(async (path: string[], options: Partial<LintCommandOptions>) => {

                    const myOptions = massageLintOptions(options);

                    return command(path, myOptions);
                    
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
