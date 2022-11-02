import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { ManifetsLoader } from '../../tools/manifests-loader'
import { K8sPackageValidator } from '../../tools/k8s-package-validator';
import { K8sApiSchemaFetcher, K8sApiSchemaFetcherResult } from '../../tools/k8s-api-schema-fetcher';
import { CommandBuilder } from '../../infra/command-action';

import { output } from './output';
import { formatResult } from './format';
import { ManifestPackage } from '../../tools/manifest-package';
import { LintManifestsResult } from './types';
import { DefaultNamespaceSetter } from '../../tools/default-namespace-setter';
import { LocalRegistryPopulator } from '../../tools/local-registry-populator';
import { RuleRegistry } from '../../tools/rule-registry';
import { RulesRuntime } from '../../tools/rules-runtime';

type TData = {
    manifestPackage: ManifestPackage,
    k8sSchemaInfo: K8sApiSchemaFetcherResult
}

export default function (program: Command)
{
    program
        .command('lint')
        .description('Lints Kubernetes manifests for API syntax validity')
        .argument('[path...]', 'Path to file, directory, URL, or search pattern')
        .option('--ignore-unknown', 'Ignore unknown resources. Use when manifests include CRDs and not using --live-k8s option.')
        .option('--skip-apply-crds', 'Skips CRD application.')
        .option('--k8s-version <version>', 'Target Kubernetes version. Do not use with --live-k8s option.')
        .option('--live-k8s', 'Lint against live Kubernetes cluster. Allows validation of CRDs. Do not use with --k8s-version option.')
        .option('--kubeconfig <path>', 'Optionally set the path to the kubeconfig file. Use with --live-k8s option.')
        .option('--json', 'Output lint result in JSON.')
        .action(
            new CommandBuilder<TData, LintManifestsResult>()
                .perform(async (path: string[], options) => {

                    logger.info("[PATH] ", path);

                    const loader = new ManifetsLoader(logger);
                    const manifestPackage = await loader.load(path);
        
                    let k8sSchemaInfo : K8sApiSchemaFetcherResult | null = null;
        
                    const k8sApiSchemaFetcher = new K8sApiSchemaFetcher(logger);
                    if (options.liveK8s) {
                        k8sSchemaInfo = await k8sApiSchemaFetcher.fetchRemote(options.kubeconfig);
                    } else {
                        k8sSchemaInfo = await k8sApiSchemaFetcher.fetchLocal(options.k8sVersion);
                    }

                    if (!k8sSchemaInfo.success) {
                        console.log('Could not fetch Kubernetes API Schema. ');
                        console.log(k8sSchemaInfo.error);
                        process.exit(98);
                    }
        
                    logger.info("Schema Fetch Success: %s", k8sSchemaInfo.success);
                    logger.info("TargetK8sVersion: %s", k8sSchemaInfo.targetVersion);
                    logger.info("TargetK8sVersion: %s", k8sSchemaInfo.targetVersion);
                    logger.info("SelectedK8sVersion: %s", k8sSchemaInfo.selectedVersion);
                    logger.info("Found: %s", k8sSchemaInfo.found);
                    logger.info("FoundExact: %s", k8sSchemaInfo.foundExact);
        
                    if (!k8sSchemaInfo.k8sJsonSchema)
                    {
                        console.log('Could not find K8s version: ', k8sSchemaInfo.targetVersion);
                        console.log('Select from available versions by running:');
                        console.log('$ kubevious list-known-k8s-versions');
                        
                        process.exit(99);
                    }
        
                    const packageValidator = new K8sPackageValidator(logger, k8sSchemaInfo.k8sJsonSchema, manifestPackage, {
                        ignoreUnknown: options.ignoreUnknown ? true : false,
                        skipApplyCrds: options.skipApplyCrds ? true : false,
                    });
                    await packageValidator.validate();

                    {
                        const processor = new DefaultNamespaceSetter(logger, packageValidator.k8sJsonSchema, manifestPackage);
                        processor.process();
                    }

                    {
                        const processor = new LocalRegistryPopulator(logger, packageValidator.k8sJsonSchema, manifestPackage);
                        processor.process();
                        await processor.localRegistryAccessor.debugOutputToDir(logger, 'local-registry');
                    }

                    {
                        const ruleRegistry = new RuleRegistry(logger);
                        await ruleRegistry.init();

                        const rulesRuntime = new RulesRuntime(logger, ruleRegistry);
                        await rulesRuntime.init();
                    }

                    return {
                        manifestPackage,
                        k8sSchemaInfo
                    } 
                })
                .format(({ manifestPackage, k8sSchemaInfo }) => {
                    const result = formatResult(manifestPackage, k8sSchemaInfo);
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
