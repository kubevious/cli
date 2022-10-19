import { Command } from 'commander';
import { logger } from '../../logger';

import { ManifetsLoader } from '../../tools/manifests-loader'
import { ExtractManifestsResult }from './types';
import { output } from './output';
import { CommandBuilder } from '../../infra/command-action';
import { ManifestPackage } from '../../tools/manifest-package';

export default function (program: Command)
{
    program
        .command('extract')
        .description('Extracts and lists Kubernetes Manifests')
        .argument('<path>', 'Path to file, directory, URL, or search pattern')
        .action(
            
            new CommandBuilder<ManifestPackage, ExtractManifestsResult>()
                .perform(async (path) => {
                    logger.info("path: ", path);

                    const loader = new ManifetsLoader(logger);
                    const manifestPackage = await loader.load(path);
                    return manifestPackage;
        
                })
                .format(manifestPackage => {
                    const result : ExtractManifestsResult = {
                        manifestPackage: manifestPackage
                    }
                    return result;
                })
                .output(output)
                .build()
    
        )
        ;
}
