import _ from 'the-lodash';
import { Command } from 'commander';
import { logger } from '../../logger';

import { ManifetsLoader } from '../../tools/manifests-loader'
import { PackageRenderer } from '../../tools/package-renderer';
import { K8sApiSchemaRegistry } from '../../tools/k8s-api-schema-registry';
import { K8sPackageValidator } from '../../tools/k8s-package-validator';

import { LintManifestsResult } from './types';
import { output } from './output';

export default function (program: Command)
{
    program
        .command('lint')
        .description('Lints Kubernetes manifests and')
        .argument('<path>', 'Path to file, directory or search pattern')
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

            // const renderer = new PackageRenderer(logger);
            // renderer.renderPackageFiles(manifestPackage);
            // renderer.renderPackageFileErrors(manifestPackage);
            // renderer.renderPackageManifests(manifestPackage);
            // renderer.renderPackageManifestsErrors(manifestPackage);

            const result: LintManifestsResult = {
                success: true,
                sources: [],
                manifests: [],
            };

            for(const source of manifestPackage.sources)
            {
                result.sources.push({
                    kind: source.source.kind,
                    path: source.source.path,
                    manifestCount: source.contents.length,
                    success: source.success,
                    errors: source.errors,
                    manifests: []
                });

                if (!source.success) {
                    result.success = false;
                }
            }

            result.sources = 
                _.chain(result.sources)
                 .orderBy([x => x.kind, x => x.path])
                 .value();

            for(const manifest of manifestPackage.manifests)
            {
                result.manifests.push({
                    source: manifest.source.source,

                    apiVersion: manifest.id.apiVersion,
                    kind: manifest.id.kind,
                    namespace: manifest.id.namespace,
                    name: manifest.id.name,
                
                    success: manifest.success,
                    errors: manifest.errors,
                });

                if (!manifest.success) {
                    result.success = false;
                }
            }

            result.manifests = 
                _.chain(result.manifests)
                .orderBy([x => x.source.kind, x => x.source.path, x => x.namespace, x => x.apiVersion, x => x.kind, x => x.name])
                .value();

            output(result);
        });
}
