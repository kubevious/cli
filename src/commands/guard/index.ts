import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { CommandBuilder } from '../../infra/command-action';
import { GuardCommandData, GuardCommandOptions, GuardResult } from './types';

import { command, massageGuardOptions } from './command';
import { formatResult } from './format';
import { output } from './output';

export default function (program: Command)
{
    program
        .command('guard')
        .description('Lint local manifests and validate Kubernetes for cross-manifest violations and errors')
        .argument('[path...]', 'Path to file, directory, search pattern or URL')
        .option('--ignore-unknown', 'Ignore unknown resources. Use when manifests include CRDs and not using --live-k8s option.')
        .option('--skip-apply-crds', 'Skips CRD application.')
        .option('--k8s-version <version>', 'Target Kubernetes version. Do not use with --live-k8s option.')
        .option('--stream', 'Also read manifests from stream')
        .option('--live-k8s', 'Lint against live Kubernetes cluster. Allows validation of CRDs. Do not use with --k8s-version option.')
        .option('--kubeconfig <path>', 'Optionally set the path to the kubeconfig file. Use with --live-k8s option.')
        .option('--include-remote-targets', 'Include remote Kubernetes manifests in target rules. Use with --live-k8s option.')
        .option('--skip-local-rules', 'Skip validation of rules passed to the CLI.')
        .option('--skip-remote-rules', 'Skip validation of rules that are already in the K8s cluster. Only used wth --live-k8s flag.')
        .option('--namespace <namespace>', 'Optionally specify namespace to process.')
        .option('--namespaces [namespace...]', 'Or specify multiple namespaces to process.')
        .option('--skip-cluster-scope', 'Skip processing clustered manifests and rules.')
        .option('--json', 'Output lint result in JSON.')
        .action(
            new CommandBuilder<GuardCommandData, GuardResult>()
                .perform(async (path: string[], options: Partial<GuardCommandOptions>) => {

                    const myOptions = massageGuardOptions(options);

                    return command(path, myOptions);
                    
                })
                .format(({ manifestPackage, k8sSchemaInfo, rulesRuntime }) => {
                    const result = formatResult(manifestPackage, k8sSchemaInfo, rulesRuntime);
                    return result;
                })
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
