import chalk from 'chalk';
import emoji from 'node-emoji';
import { logger } from '../../logger';
import { PackageRenderer } from '../../tools/package-renderer';

import { ExtractManifestsResult } from "./types";

export function output(result: ExtractManifestsResult)
{
    const renderer = new PackageRenderer(logger);
    renderer.renderPackageFiles(result.manifestPackage);
    renderer.renderPackageFileErrors(result.manifestPackage);
    renderer.renderPackageManifests(result.manifestPackage);
}