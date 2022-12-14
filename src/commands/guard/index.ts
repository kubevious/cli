import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { CommandBuilder } from '../../infra/command-action';
import { GuardCommandData, GuardCommandOptions, GuardResult } from './types';

import { command, massageGuardOptions } from './command';
import { formatResult } from './format';
import { output } from './output';

import { DESCRIPTION, SUMMARY } from './docs';
import { ARG_PATH, OPTION_DETAILED, OPTION_IGNORE_NON_K8S, OPTION_IGNORE_UNKNOWN, OPTION_JSON, OPTION_K8S_VERSION, OPTION_KUBECONFIG, OPTION_LIVE_K8S, OPTION_SKIP_APPLY_CRDS, OPTION_STREAM } from '../lint/docs';

export default function (program: Command)
{
    program
        .command('guard')
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
        .option('--include-remote-targets', 'Include remote Kubernetes manifests in target rules. Use with --live-k8s option.')
        .option('--skip-local-rules', 'Skip validation of rules passed to the CLI.')
        .option('--skip-remote-rules', 'Skip validation of rules that are already in the K8s cluster. Only used wth --live-k8s flag.')
        .option('--namespace <namespace>', 'Optionally specify namespace to process.')
        .option('--namespaces [namespace...]', 'Or specify multiple namespaces to process.')
        .option('--skip-cluster-scope', 'Skip processing clustered manifests and rules.')
        .option('--skip-community-rules', 'Skip community rules library.')
        .option('--detailed', OPTION_DETAILED)
        .option('--json', OPTION_JSON)
        .action(
            new CommandBuilder<GuardCommandData, GuardResult>()
                .perform(async (path: string[], options: Partial<GuardCommandOptions>) => {

                    const myOptions = massageGuardOptions(options);

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
