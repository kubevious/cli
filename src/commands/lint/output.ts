import { IconDefinition, print, printFailLine, printInfoLine, printProcessStatus, printSectionTitle, printSummaryCounter, printWarningLine, printWarnings, SOURCE_ICONS, STATUS_ICONS } from '../../screen';
import { LintManifestsResult } from "./types";
import { ManifestSourceId } from '../../types/manifest';
import { K8sObjectId } from '../../types/k8s';
import { outputManifestPackageResult } from '../../screen/manifest';

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
    
    outputManifestPackageResult(result.packageResult);
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
    printProcessStatus(result.severity, 'Lint');
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
