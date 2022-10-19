import chalk from 'chalk';
import emoji from 'node-emoji';

import { LintManifestResult, LintManifestsResult, LintSeverity, LintSourceResult, LintStatus } from "./types";
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

    parts.push(objectSeverityIcon(source));

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
    parts.push(objectSeverityIcon(manifest));

    parts.push(namingParts.join(', '));

    return console.log(indentify(parts.join(' '), 3));
}

function outputErrors(obj: ErrorStatus, indent: number)
{
    if (!obj.success) {
        if (obj.errors) {
            for(const msg of obj.errors)
            {
                const line = `${severityStatusIcon('fail')} ${msg}`;
                console.log(indentify(line, indent));
            }
        }
    }

    if (obj.warnings) {
        for(const msg of obj.warnings)
        {
            const line = `${severityStatusIcon('warning')} ${msg}`;
            console.log(indentify(line, indent));
        }
    }
}

function objectSeverityIcon(obj: LintStatus)
{
    return severityStatusIcon(obj.severity);
}

function severityStatusIcon(severity: LintSeverity)
{
    let iconName = 'question';
    if (severity === 'pass') {
        iconName = 'white_check_mark';
    }
    else if (severity === 'fail') {
        iconName = 'x';
    }
    else if (severity === 'warning') {
        return `${emoji.get('warning')} `;
    }
    return `${emoji.get(iconName)}`;
}


function indentify(str: string, count: number) : string
{
    const prefix = ' '.repeat(count);
    let lines = str.split('\n');
    lines = lines.map(x => `${prefix}${x}`);
    return lines.join('\n');
}