import { IconDefinition, print, printErrors, printFailLine, printInfoLine, printProcessStatus, printSectionTitle, printSummaryCounter, printWarningLine, printWarnings, SOURCE_ICONS, STATUS_ICONS } from '../../screen';
import { LintManifestsResult, LintSeverity, LintSourceResult } from "./types";
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
        printFailLine(`Failed to find Kubernetes Version ${result.targetK8sVersion}`);
    }
    else {
        if (!result.foundExactK8sVersion) {
            printWarningLine(`Could not find requested Kubernetes Version: ${result.targetK8sVersion}`);
        }
    }
    printInfoLine(`Linting against Kubernetes Version: ${result.selectedK8sVersion}`);
    print();
    

    for(const source of result.sources)
    {
        outputSource(source);
        outputErrors(source, 3);

        for(const manifest of source.manifests)
        {
            outputManifest(manifest, severityStatusIcon(manifest.severity), 3);
            outputErrors(manifest, 6);
        }

        print();
    }

    print();

    if (!params.skipSummary)
    {
        outputLintSummary(result);
    }

    if (!params.skipResult)
    {
        outputLintResult(result);
    }
}

export function outputLintResult(result: LintManifestsResult)
{
    printProcessStatus(result.success, 'Lint');
}

export function outputLintSummary(result: LintManifestsResult)
{
    printSectionTitle('Lint Summary');


    print(`Sources: ${result.counters.sources.total}`, 4);
    printSummaryCounter(STATUS_ICONS.failed, 'Sources with Errors', result.counters.sources.withErrors);

    print(`Manifests: ${result.counters.manifests.total}`, 4);
    printSummaryCounter(STATUS_ICONS.passed, 'Manifests Passed', result.counters.manifests.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Manifests with Errors', result.counters.manifests.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Manifests With Warnings', result.counters.manifests.withWarnings);
}

export function outputSource(source: LintSourceResult, indent?: number)
{
    const parts : string[] = [];

    parts.push(severityStatusIcon(source.severity).get());

    parts.push(produceSourceLine(source));
    
    print(parts.join(' '), indent);
}

export function produceSourceLine(source: ManifestSourceId)
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

export function outputManifest(manifest: K8sObjectId, icon: IconDefinition, indent: number)
{
    const namingParts : string[] = [];

    if (manifest.namespace) {
        namingParts.push(`Namespace: ${manifest.namespace}`);
    }
    namingParts.push(`API: ${manifest.apiVersion}`);
    namingParts.push(`Kind: ${manifest.kind}`);
    namingParts.push(`Name: ${manifest.name}`);

    const line = namingParts.join(', ')

    print(`${icon.get()} ${line}`, indent);
}

function outputErrors(obj: ErrorStatus, indent?: number)
{
    if (!obj.success) {
        printErrors(obj.errors, indent);
    }

    printWarnings(obj.warnings, indent);
}


function severityStatusIcon(severity: LintSeverity)
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

