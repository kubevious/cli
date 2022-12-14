import { SOURCE_ICONS, STATUS_ICONS, print, printErrorLine, printWarningLine, printSectionTitle, IconDefinition, printInfoLine, printPassLine } from ".";
import { ManifestSourceId } from "../types/manifest";
import { ManifestInfoResult, ManifestPackageResult, ManifestResult } from "../types/manifest-result";
import { ResultObject, ResultObjectSeverity } from "../types/result";
import { SourceInfoResult, SourceResult } from "../types/source-result";


export interface outputManifestInfoOptions {
    icon? : IconDefinition
}

export interface outputHideSeverityOptions {
    hideSeverityIcon?: boolean
}


export function outputManifestPackageResultSources(packageResult: ManifestPackageResult, detailed?: boolean, indent?: number)
{
    detailed = detailed ?? false;
    indent = indent ?? 0;
    printSectionTitle('Sources', indent);

    const nestedIndent = (indent ?? 0) + 3;

    if ((packageResult.rootSource.children ?? []).length === 0)
    {
        printWarningLine('No Sources provided', nestedIndent)
    }
    else
    {
        if (!detailed && (packageResult.rootSource.severity == 'pass'))
        {
            printPassLine('No issues with sources.', nestedIndent);
        }
        else
        {
            outputSourceResult(packageResult.rootSource, detailed, nestedIndent);
        }
    }

    print();
}

export function outputManifestPackageResultManifests(packageResult: ManifestPackageResult, detailed?: boolean, indent?: number)
{
    detailed = detailed ?? false;
    indent = indent ?? 0;

    const nestedIndent = (indent ?? 0) + 3;

    printSectionTitle('Manifests', indent);

    if (packageResult.manifests.length === 0)
    {
        printWarningLine('No Manifests found', nestedIndent)
        print();
    }
    else
    {
        if (!detailed && (packageResult.severity == 'pass'))
        {
            printPassLine('No issues with manifests.', nestedIndent);
        }
        else
        {
            for(const manifest of packageResult.manifests)
            {
                outputManifestResult(manifest, detailed, nestedIndent);
            }
        }
    }

    print();
}

function outputSourceResult(sourceResult: SourceResult, detailed: boolean, indent: number)
{
    if (!detailed) {
        if (sourceResult.severity == 'pass') {
            return;
        }
    }

    if (sourceResult.kind !== 'root') {
        outputSourceInfo(sourceResult, indent);
        indent += 3;
    }

    outputMessages(sourceResult, indent);

    for(const childSource of sourceResult.children ?? [])
    {
        outputSourceResult(childSource, detailed, indent);
    }

    if (detailed)
    {
        for(const manifest of sourceResult.manifests ?? [])
        {
            outputManifestInfo(manifest, indent);
            outputMessages(manifest, indent + 3);
        }
    }

    print();
}


export function outputSourceInfo(sourceResult: SourceInfoResult, indent?: number, options?: outputHideSeverityOptions)
{
    const parts : string[] = [];

    // const hideSeverityIcon = options?.hideSeverityIcon ?? false;
    if (!options?.hideSeverityIcon) {
        parts.push(severityStatusIcon(sourceResult.severity).get());
    }

    parts.push(produceSourceLine(sourceResult));
    
    print(parts.join(' '), indent);
}


export function outputManifestInfo(manifest: ManifestInfoResult, indent?: number, options?: outputManifestInfoOptions)
{
    options = options ?? {};

    const namingParts : string[] = [];

    if (manifest.namespace) {
        namingParts.push(`Namespace: ${manifest.namespace}`);
    }
    namingParts.push(`API: ${manifest.apiVersion}`);
    namingParts.push(`Kind: ${manifest.kind}`);
    namingParts.push(`Name: ${manifest.name}`);

    const line = namingParts.join(', ');

    const icon = options.icon ?? severityStatusIcon(manifest.severity);

    print(`${icon.get()} ${line}`, indent);
}

export function outputManifestResult(manifestResult: ManifestResult, detailed: boolean, indent?: number, options?: outputManifestInfoOptions)
{
    if (!detailed) {
        if (manifestResult.severity === 'pass') {
            return;
        }
    }

    outputManifestInfo(manifestResult, indent, options);

    outputManifestResultSources(manifestResult, (indent ?? 0) + 3, { hideSeverityIcon: true });

    outputMessages(manifestResult, (indent ?? 0) + 3);

    print();
}

export function outputManifestResultSources(manifestResult: ManifestResult, indent?: number, options?: outputHideSeverityOptions)
{
    for(const source of manifestResult.sources)
    {
        outputSourceInfo(source, indent, options);
    }
}

export function severityStatusIcon(severity: ResultObjectSeverity)
{
    if (severity === 'pass') {
        return STATUS_ICONS.passed;
    }
    else if (severity === 'fail') {
        return STATUS_ICONS.failed;
    }
    else if (severity === 'warning') {
        return STATUS_ICONS.warning;
    }
    return STATUS_ICONS.question;
}

export function produceSourceLine(source: SourceInfoResult)
{
    const parts : string[] = [];

    if (source.kind === 'file')
    {
        parts.push(SOURCE_ICONS.file.get());
    }
    else if (source.kind === 'web')
    {
        parts.push(SOURCE_ICONS.web.get());
    }
    else if (source.kind === 'stream')
    {
        parts.push(SOURCE_ICONS.stream.get());
    }
    else if (source.kind === 'k8s')
    {
        parts.push(SOURCE_ICONS.k8s.get());
    }
    else if (source.kind === 'helm')
    {
        parts.push(SOURCE_ICONS.helm.get());
    }
    else if (source.kind === 'kustomize')
    {
        parts.push(SOURCE_ICONS.kustomize.get());
    }

    parts.push(`${source.kind.toUpperCase()}:`);

    parts.push(source.path);
    
    return parts.join(' ');
}


export function outputMessages(obj: ResultObject, indent?: number)
{
    for(const msg of obj.messages ?? [])
    {
        if (msg.severity === 'error') {
            printErrorLine(msg.msg, indent);
        } else if (msg.severity === 'warning') {
            printWarningLine(msg.msg, indent);
        }
    }
}
