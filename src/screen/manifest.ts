import { SOURCE_ICONS, STATUS_ICONS, print, printErrorLine, printWarningLine, printSectionTitle } from ".";
import { ManifestInfoResult, ManifestPackageResult, ManifestResult } from "../types/manifest-result";
import { ResultObject, ResultObjectSeverity } from "../types/result";
import { SourceInfoResult, SourceResult } from "../types/source-result";

export function outputManifestPackageResult(packageResult: ManifestPackageResult)
{
    printSectionTitle('SOURCES:');
    
    for(const source of packageResult.sources)
    {
        outputSourceResult(source);
    }

    printSectionTitle('MANIFESTS:');

    for(const manifest of packageResult.manifests)
    {
        outputManifestResult(manifest);
    }
}

export function outputSourceResult(sourceResult: SourceResult, indent?: number)
{
    outputSourceInfo(sourceResult, indent);
    outputMessages(sourceResult, (indent ?? 0) + 3);

    for(const childSource of sourceResult.children ?? [])
    {
        outputSourceResult(childSource, (indent ?? 0) + 3);
    }

    for(const manifest of sourceResult.manifests ?? [])
    {
        outputManifestInfo(manifest, (indent ?? 0) + 3);
    }

    print();
}


export function outputSourceInfo(sourceResult: SourceInfoResult, indent?: number)
{
    const parts : string[] = [];

    parts.push(severityStatusIcon(sourceResult.severity).get());

    parts.push(produceSourceLine(sourceResult));
    
    print(parts.join(' '), indent);
}

export function outputManifestInfo(manifest: ManifestInfoResult, indent?: number)
{
    const namingParts : string[] = [];

    if (manifest.namespace) {
        namingParts.push(`Namespace: ${manifest.namespace}`);
    }
    namingParts.push(`API: ${manifest.apiVersion}`);
    namingParts.push(`Kind: ${manifest.kind}`);
    namingParts.push(`Name: ${manifest.name}`);

    const line = namingParts.join(', ');

    print(`${severityStatusIcon(manifest.severity).get()} ${line}`, indent);
}

export function outputManifestResult(manifestResult: ManifestResult, indent?: number)
{
    outputManifestInfo(manifestResult, indent);

    for(const source of manifestResult.sources)
    {
        outputSourceInfo(source, (indent ?? 0) + 3);
    }

    outputMessages(manifestResult, (indent ?? 0) + 3);

    print();
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

    parts.push(`${source.kind.toUpperCase()}:`);

    parts.push(source.path);
    
    return parts.join(' ');
}


function outputMessages(obj: ResultObject, indent?: number)
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
