import { OBJECT_ICONS, print, printFailLine, printInfoLine, printProcessStatus, printSectionTitle, printSummaryCounter, printWarningLine, STATUS_ICONS } from '../../screen';
import { LintManifestsResult } from "./types";
import { outputManifestPackageResultManifests, outputManifestPackageResultSources } from '../../screen/manifest';

export interface LintOutputParams {
    skipResult?: boolean,
    skipSummary?: boolean
}

export function output(result: LintManifestsResult, detailed?: boolean, params?: LintOutputParams)
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
    
    outputManifestPackageResultSources(result.packageResult, detailed);
    outputManifestPackageResultManifests(result.packageResult, detailed);

    if (!params.skipSummary)
    {
        outputLintSummary(result);
    }

    if (!params.skipResult)
    {
        if (!detailed) {
            print();
            printInfoLine(`Run with --detailed to see all sources and manifests`);
        }

        printProcessStatus(result.severity, 'Lint');
    }
}

export function outputLintSummary(result: LintManifestsResult)
{
    printSectionTitle('Summary');

    const lintCounters = result.counters;

    print(`${OBJECT_ICONS.source.get()} Sources: ${lintCounters.sources.total}`, 4);
    printSummaryCounter(STATUS_ICONS.failed, 'Sources with Errors', lintCounters.sources.withErrors);

    print(`${OBJECT_ICONS.manifest.get()} Manifests: ${lintCounters.manifests.total}`, 4);
    printSummaryCounter(STATUS_ICONS.passed, 'Valid Manifests', lintCounters.manifests.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Manifests with Errors', lintCounters.manifests.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Manifests with Warnings', lintCounters.manifests.withWarnings);
}

