import { Command } from 'commander';
import { logger } from '../logger';

import { ManifetsLoader } from '../tools/manifests-loader'
import { PackageRenderer } from '../tools/package-renderer';
import { K8sApiSchemaRegistry } from '../tools/k8s-api-schema-registry';
import { K8sPackageValidator } from '../tools/k8s-package-validator';

export default function (program: Command)
{
    program
        .command('lint')
        .description('Lints Kubernetes manifests and')
        .argument('<path>', 'Path to file, directory or search pattern')
        .action((path, options) => {

            logger.info("OPTIONS: ", options);
            logger.info("path: ", path);

            const loader = new ManifetsLoader(logger);
            loader.load(path);

            const manifestPackage = loader.package;

            const k8sApiRegistry = new K8sApiSchemaRegistry(logger);
            k8sApiRegistry.init();
            const k8sJsonSchema = k8sApiRegistry.getVersionSchema('v1.25.2');

            const packageValidator = new K8sPackageValidator(logger, k8sJsonSchema);
            packageValidator.validate(manifestPackage);

            const renderer = new PackageRenderer(logger);
            renderer.renderPackageFiles(manifestPackage);
            renderer.renderPackageFileErrors(manifestPackage);
            renderer.renderPackageManifests(manifestPackage);
            renderer.renderPackageManifestsErrors(manifestPackage);
        });
}
