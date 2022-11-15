import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { CommandBuilder } from '../../infra/command-action';
import { LintCommandData, LintCommandOptions, LintManifestsResult } from './types';

import { command, massageLintOptions } from './command';
import { formatResult } from './format';
import { output } from './output';

export default function (program: Command)
{
    program
        .command('lint')
        .description('Check Kubernetes manifests for API syntax validity')
        .argument('[path...]', 'Path to file, directory, search pattern or URL')
        .option('--ignore-unknown', 'Ignore unknown resources. Use when manifests include CRDs and not using --live-k8s option.')
        .option('--ignore-non-k8s', 'Ignore non-k8s files.')
        .option('--skip-apply-crds', 'Skips CRD application.')
        .option('--k8s-version <version>', 'Target Kubernetes version. Do not use with --live-k8s option.')
        .option('--stream', 'Also read manifests from stream')
        .option('--live-k8s', 'Lint against live Kubernetes cluster. Allows validation of CRDs. Do not use with --k8s-version option.')
        .option('--kubeconfig <path>', 'Optionally set the path to the kubeconfig file. Use with --live-k8s option.')
        .option('--json', 'Output lint result in JSON.')
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
