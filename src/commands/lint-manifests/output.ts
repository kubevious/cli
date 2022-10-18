import chalk from 'chalk';
import emoji from 'node-emoji';

import { LintManifestResult, LintManifestsResult, LintSourceResult } from "./types";
import { ErrorStatus } from '../../types/manifest';

export function output(result: LintManifestsResult)
{
    if (!result.foundK8sVersion) {
        console.log(`${emoji.get('x')}  Failed to find Kubernetes Version ${result.targetK8sVersion}`);
    }
    else {
        if (!result.foundExactK8sVersion) {
            console.log(`${emoji.get('warning')}  Could not find requested Kubernetes Version: ${result.targetK8sVersion}`);
        }
    }
    console.log(`${emoji.get('information_source')}  Linting against Kubernetes Version: ${result.selectedK8sVersion}`);
    console.log();

    for(const source of result.sources)
    {
        outputSource(source);
        outputErrors(source, 3);

        for(const manifest of source.manifests)
        {
            outputManifest(manifest);
            outputErrors(manifest, 6);
        }

        console.log();
    }

    console.log();

    if (result.success)
    {
        console.log(`${emoji.get('white_check_mark')} Lint Succeeded.`);
    }
    else
    {
        console.log(`${emoji.get('x')} Lint Failed`);
    }

}

function outputSource(source: LintSourceResult)
{
    const parts : string[] = [];

    if (source.success)
    {
        parts.push(emoji.get('white_check_mark'));
    }
    else
    {
        parts.push(emoji.get('x'));
    }

    if (source.kind === 'file')
    {
        parts.push(emoji.get('page_facing_up'));
    }
    else if (source.kind === 'web')
    {
        parts.push(emoji.get('globe_with_meridians'));
    }

    parts.push(`${source.kind.toUpperCase()}:`);

    parts.push(source.path);

    return console.log(parts.join(' '));
}

function outputManifest(manifest: LintManifestResult)
{
    const namingParts : string[] = [];

    if (manifest.namespace) {
        namingParts.push(`Namespace: ${manifest.namespace}`);
    }
    namingParts.push(`API: ${manifest.apiVersion}`);
    namingParts.push(`Kind: ${manifest.kind}`);
    namingParts.push(`Name: ${manifest.name}`);

    const parts : string[] = [];
    if (manifest.success)
    {
        parts.push(emoji.get('white_check_mark'));
    }
    else
    {
        parts.push(emoji.get('x'));
    }

    parts.push(namingParts.join(', '));

    return console.log(indentify(parts.join(' '), 3));
}

function outputErrors(obj: ErrorStatus, indent: number)
{
    if (!obj.success) {
        if (obj.errors) {
            for(const error of obj.errors)
            {
                const msg = `${emoji.get('red_circle')} ${error}`;
                console.log(indentify(msg, indent));
            }
        }
    }
}


function indentify(str: string, count: number) : string
{
    const prefix = ' '.repeat(count);
    let lines = str.split('\n');
    lines = lines.map(x => `${prefix}${x}`);
    return lines.join('\n');
}