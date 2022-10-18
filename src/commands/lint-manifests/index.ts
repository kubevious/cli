import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { ManifetsLoader } from '../../tools/manifests-loader'
import { K8sApiSchemaRegistry } from '../../tools/k8s-api-schema-registry';
import { K8sPackageValidator } from '../../tools/k8s-package-validator';

import { output } from './output';
import { formatResult } from './format';

export default function (program: Command)
{
    program
        .command('lint')
        .description('Lints Kubernetes manifests for API syntax validity')
        .argument('<path>', 'Path to file, directory or search pattern')
        .option('--json', 'Output in JSON')
        .action(async (path, options) => {

            logger.info("OPTIONS: ", options);
            logger.info("path: ", path);

            const loader = new ManifetsLoader(logger);
            const manifestPackage = await loader.load(path)

            const k8sApiRegistry = new K8sApiSchemaRegistry(logger);
            k8sApiRegistry.init();
            const k8sJsonSchema = k8sApiRegistry.getVersionSchema('v1.25.2');

            const packageValidator = new K8sPackageValidator(logger, k8sJsonSchema);
            packageValidator.validate(manifestPackage);

            const result = formatResult(manifestPackage);

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
