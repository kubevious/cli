import { Command } from 'commander';
import { logger } from '../logger';

import { ManifetsLoader } from '../manifests-loader'
import { PackageRenderer } from '../package-renderer';


import { K8sApiSchemaRegistry } from '../k8s-api-schema-registry';

import { K8sManifestValidator } from '../k8s-manifest-validator';

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

            const k8sApiRegistry = new K8sApiSchemaRegistry(logger);
            k8sApiRegistry.init();
            const k8sJsonSchema = k8sApiRegistry.getVersionSchema('v1.25.2');

            for(const manifest of loader.package.manifests)
            {
                if (manifest.file.isValid)
                {
                    logger.error("FILE: %s", manifest.file.path);

                    try
                    {
                        const validator = new K8sManifestValidator(logger, k8sJsonSchema);
                        const result = validator.validate(manifest.config);
                        if (!result.success)
                        {
                            logger.error("ERRORS: ", result.errors!);

                            loader.package.fileErrors(manifest.file, result.errors!);
                        }
                    }
                    catch(reason: any)
                    {
                        logger.error("XXX: ", reason);
                    }
                }
            }

            const renderer = new PackageRenderer(logger);
            renderer.renderPackageFiles(loader.package);
            renderer.renderPackageFileErrors(loader.package);
            renderer.renderPackageManifests(loader.package);

        });
}
