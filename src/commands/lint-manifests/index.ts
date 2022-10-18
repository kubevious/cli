import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { ManifetsLoader } from '../../tools/manifests-loader'
import { K8sPackageValidator } from '../../tools/k8s-package-validator';
import { K8sApiSchemaFetcher } from '../../tools/k8s-api-schema-fetcher';

import { output } from './output';
import { formatResult } from './format';

export default function (program: Command)
{
    program
        .command('lint')
        .description('Lints Kubernetes manifests for API syntax validity')
        .argument('<path>', 'Path to file, directory, URL, or search pattern')
        .option('--json', 'Output in JSON')
        .option('--k8s-version <version>', 'Target Kubernetes version')
        .action(async (path, options) => {

            logger.info("OPTIONS: ", options);
            logger.info("path: ", path);

            const loader = new ManifetsLoader(logger);
            const manifestPackage = await loader.load(path);

            const k8sApiSchemaFetcher = new K8sApiSchemaFetcher(logger);
            const k8sSchemaInfo = await k8sApiSchemaFetcher.fetchLocal(options.k8sVersion);

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
                return;
            }

            const packageValidator = new K8sPackageValidator(logger, k8sSchemaInfo.k8sJsonSchema);
            packageValidator.validate(manifestPackage);

            const result = formatResult(manifestPackage, k8sSchemaInfo);

            if (options.json)
            {
                console.log(JSON.stringify(result, null, 4));
            }
            else
            {
                output(result);
            }

            if (!result.success)
            {
                process.exit(100);
            }

        });
}
