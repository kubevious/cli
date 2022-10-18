import chalk from 'chalk';
import emoji from 'node-emoji';

import { KnownK8sVersionsResult } from "./types";

export function output(result: KnownK8sVersionsResult)
{
    console.log(`${chalk.underline('Known K8s Versions:')}`);
    console.log();

    for(const version of result.versions)
    {
        console.log(`  ☸️  ${version}`);
    }
}