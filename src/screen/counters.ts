import { printSummaryCounter, STATUS_ICONS, print } from ".";
import { ManifestPackageCounters } from "../types/result";

export function outputManifestPackageCounters(counters: ManifestPackageCounters, indent? : number)
{
    print(`Sources: ${counters.sources.total}`, 4);
    printSummaryCounter(STATUS_ICONS.failed, 'Sources with Errors', counters.sources.withErrors);

    print(`Manifests: ${counters.manifests.total}`, 4);
    printSummaryCounter(STATUS_ICONS.passed, 'Manifests Passed', counters.manifests.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Manifests with Errors', counters.manifests.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Manifests With Warnings', counters.manifests.withWarnings);
}
