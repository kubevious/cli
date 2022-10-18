import { Command } from 'commander';
import { logger } from '../../logger';

import { ManifetsLoader } from '../../tools/manifests-loader'
import { ExtractManifestsResult }from './types';
import { output } from './output';

export default function (program: Command)
{
    program
        .command('extract')
        .description('Extracts and lists Kubernetes Manifests')
        .argument('<path>', 'Path to file, directory, URL, or search pattern')
        .action(async (path, options) => {

            logger.info("OPTIONS: ", options);
            logger.info("path: ", path);

            const loader = new ManifetsLoader(logger);
            const manifestPackage = await loader.load(path);

            const result : ExtractManifestsResult = {
                manifestPackage: manifestPackage
            }

            output(result);
        })
        ;
}
