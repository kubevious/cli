import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { CommandBuilder } from '../../infra/command-action';
import { GuardCommandData, GuardResult } from './types';

import { command } from './command';
import { formatResult } from './format';
import { output } from './output';

export default function (program: Command)
{
    program
        .command('guard')
        .description('Lint manifests and validate Kubevious rules for cross-manifest violations and errors')
        .argument('[path...]', 'Path to file, directory, URL, or search pattern')
        .option('--ignore-unknown', 'Ignore unknown resources. Use when manifests include CRDs and not using --live-k8s option.')
        .option('--skip-apply-crds', 'Skips CRD application.')
        .option('--k8s-version <version>', 'Target Kubernetes version. Do not use with --live-k8s option.')
        .option('--live-k8s', 'Lint against live Kubernetes cluster. Allows validation of CRDs. Do not use with --k8s-version option.')
        .option('--kubeconfig <path>', 'Optionally set the path to the kubeconfig file. Use with --live-k8s option.')
        .option('--json', 'Output lint result in JSON.')
        .action(
            new CommandBuilder<GuardCommandData, GuardResult>()
                .perform(async (path: string[], options) => {

                    return command(path, options);
                    
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
