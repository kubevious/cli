import { print, printFailLine, printInfoLine, printProcessStatus, printSectionTitle, printSummaryCounter, printWarningLine, printWarnings, SOURCE_ICONS, STATUS_ICONS } from '../../screen';
import { LintManifestsResult } from "./types";
import { ManifestSourceId } from '../../types/manifest';
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

    if (!params.skipSummary)
    {
        outputLintSummary(result);
    }

    if (!params.skipResult)
    {
        printProcessStatus(result.severity, 'Lint');
    }
}

export function outputLintSummary(result: LintManifestsResult)
{
    printSectionTitle('Summary');

    const lintCounters = result.counters;

    print(`Sources: ${lintCounters.sources.total}`, 4);
    printSummaryCounter(STATUS_ICONS.failed, 'Sources with Errors', lintCounters.sources.withErrors);

    print(`Manifests: ${lintCounters.manifests.total}`, 4);
    printSummaryCounter(STATUS_ICONS.passed, 'Manifests Passed', lintCounters.manifests.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Manifests with Errors', lintCounters.manifests.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Manifests with Warnings', lintCounters.manifests.withWarnings);
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

