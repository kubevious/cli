import { Command } from 'commander';
import { logger } from '../logger';

import { ManifetsLoader } from '../manifests-loader'
import { PackageRenderer } from '../package-renderer';

export default function (program: Command)
{
    program
        .command('scan')
        .description('Scans for Kubernetes Manifests')
        .argument('<path>', 'Path to file, directory or search pattern')
        .action((path, options) => {

            logger.info("OPTIONS: ", options);
            logger.info("path: ", path);

            const loader = new ManifetsLoader(logger);
            loader.load(path);

            const renderer = new PackageRenderer(logger);
            renderer.renderPackageFiles(loader.package);
            renderer.renderPackageFileErrors(loader.package);
            renderer.renderPackageManifests(loader.package);

        });
}
