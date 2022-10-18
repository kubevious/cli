import chalk from 'chalk';
import emoji from 'node-emoji';

import { LintManifestsResult } from "./types";
import { logger } from '../../logger';

const log = console.log;

export function output(result: LintManifestsResult)
{
    // logger.error("RESULT: ", result);

    console.log(chalk.underline('Sources:'));
    for(const source of result.sources)
    {
        if (source.success) {
            console.log(`  ${emoji.get('white_check_mark')} ${source.kind.toUpperCase()}: ${source.path}`);
        } else {
            console.log(`  ${emoji.get('x')} ${source.kind.toUpperCase()} ${source.path}`);

            if (source.errors) {
                for(const error of source.errors)
                {
                    const msg = `${emoji.get('red_circle')} ${error}`;
                    console.log(indentify(msg, 6));
                }
            }
        }
        console.log();
    }

    console.log();

    console.log(chalk.underline('Manifests:'));
    for(const manifest of result.manifests)
    {
        console.log(`  ${emoji.get('page_facing_up')} ${manifest.source.kind.toUpperCase()}: ${manifest.source.path}`);

        const parts: string[] = [];
        if (manifest.namespace) {
            parts.push(`Namespace: ${manifest.namespace}`);
        }
        parts.push(`API: ${manifest.apiVersion}`);
        parts.push(`Kind: ${manifest.kind}`);
        parts.push(`Name: ${manifest.name}`);
        
        console.log(`    `, manifest.success ? emoji.get('white_check_mark') : emoji.get('x'), parts.join(', '));

        if (!manifest.success) {
            if (manifest.errors) {
                for(const error of manifest.errors)
                {
                    const msg = `${emoji.get('red_circle')} ${error}`;
                    console.log(indentify(msg, 8));
                }
            }
        }

        console.log();
    }

    if (result.success)
    {
        console.log(`${emoji.get('white_check_mark')} Lint Succeeded.`);
    }
    else
    {
        console.log(`${emoji.get('x')} Lint Failed`);
    }

}

function indentify(str: string, count: number) : string
{
    const prefix = ' '.repeat(count);
    let lines = str.split('\n');
    lines = lines.map(x => `${prefix}${x}`);
    return lines.join('\n');
}