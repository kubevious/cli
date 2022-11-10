import chalk from 'chalk';
import emoji from 'node-emoji';

import { LintManifestsResult, LintSeverity, LintSourceResult, LintStatus } from "./types";
import { ErrorStatus, ManifestSourceId } from '../../types/manifest';
import { K8sObjectId } from '../../types/k8s';

export interface LintOutputParams {
    skipResult?: boolean,
    skipSummary?: boolean
}

export function output(result: LintManifestsResult, params?: LintOutputParams)
{
    params = params ?? {};
    params.skipSummary = params.skipSummary ?? false;
    params.skipResult = params.skipResult ?? false;

    if (!result.foundK8sVersion) {
        print(`${emoji.get('x')}  Failed to find Kubernetes Version ${result.targetK8sVersion}`);
    }
    else {
        if (!result.foundExactK8sVersion) {
            print(`${emoji.get('warning')}  Could not find requested Kubernetes Version: ${result.targetK8sVersion}`);
        }
    }
    print(`${emoji.get('information_source')}  Linting against Kubernetes Version: ${result.selectedK8sVersion}`);
    print();
    

    for(const source of result.sources)
    {
        outputSource(source);
        outputErrors(source, 3);

        for(const manifest of source.manifests)
        {
            outputManifest(manifest, objectSeverityIcon(manifest), 3);
            outputErrors(manifest, 6);
        }

        print();
    }

    print();

    if (!params.skipSummary)
    {
        outputLintSummary(result);
        print();
    }

    if (!params.skipResult)
    {
        if (result.success)
        {
            print(`${emoji.get('white_check_mark')} Lint Succeeded.`);
        }
        else
        {
            print(`${emoji.get('x')} Lint Failed`);
        }
    }
}

export function outputLintSummary(result: LintManifestsResult)
{
    print(chalk.underline('Lint Summary'));

    print(`Sources: ${result.counters.sources.total}`, 4);
    print(`${severityStatusIcon('fail')} Sources with Errors: ${result.counters.sources.withErrors}`, 8);

    print(`Manifests: ${result.counters.manifests.total}`, 4);
    print(`${severityStatusIcon('pass')} Manifests Passed: ${result.counters.manifests.passed}`, 8);
    print(`${severityStatusIcon('fail')} Manifests with Errors: ${result.counters.manifests.withErrors}`, 8);
    print(`${severityStatusIcon('warning')} Manifests with Warnings: ${result.counters.manifests.withWarnings}`, 8);
}

export function outputSource(source: LintSourceResult, indent?: number)
{
    const parts : string[] = [];

    parts.push(objectSeverityIcon(source));

    parts.push(produceSourceLine(source));
    
    print(parts.join(' '), indent);
}

export function produceSourceLine(source: ManifestSourceId)
{
    const parts : string[] = [];

    if (source.kind === 'file')
    {
        parts.push(emoji.get('page_facing_up'));
    }
    else if (source.kind === 'web')
    {
        parts.push(emoji.get('globe_with_meridians'));
    }
    else if (source.kind === 'stream')
    {
        parts.push(emoji.get('aquarius'));
    }
    else if (source.kind === 'k8s')
    {
        parts.push('☸️ ');
    }

    parts.push(`${source.kind.toUpperCase()}:`);

    parts.push(source.path);
    
    return parts.join(' ');
}

export function outputManifest(manifest: K8sObjectId, icon: string, indent: number)
{
    const namingParts : string[] = [];

    if (manifest.namespace) {
        namingParts.push(`Namespace: ${manifest.namespace}`);
    }
    namingParts.push(`API: ${manifest.apiVersion}`);
    namingParts.push(`Kind: ${manifest.kind}`);
    namingParts.push(`Name: ${manifest.name}`);

    const parts : string[] = [];
    parts.push(icon);

    parts.push(namingParts.join(', '));

    print(parts.join(' '), indent);
}

function outputErrors(obj: ErrorStatus, indent?: number)
{
    if (!obj.success) {
        if (obj.errors) {
            for(const msg of obj.errors)
            {
                const line = `${severityStatusIcon('fail')} ${msg}`;
                print(line, indent);
            }
        }
    }

    if (obj.warnings) {
        for(const msg of obj.warnings)
        {
            const line = `${severityStatusIcon('warning')} ${msg}`;
            print(line, indent);
        }
    }
}

function objectSeverityIcon(obj: LintStatus)
{
    return severityStatusIcon(obj.severity);
}

export function severityStatusIcon(severity: LintSeverity)
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


export function indentify(str: string, count?: number) : string
{
    const prefix = ' '.repeat(count ?? 0);
    let lines = str.split('\n');
    lines = lines.map(x => `${prefix}${x}`);
    return lines.join('\n');
}

export function print(str?: string, indent?: number)
{
    console.log(indentify(str ?? "", indent));
}