import _ from 'the-lodash';

import { LintCommandData, LintManifestsResult } from "./types";
import { logger } from '../../logger';
import { calculateManifestPackageCounters } from '../../manifests/counters';

const myLogger = logger.sublogger('LintFormat');

export function formatResult({
        manifestPackage,
        k8sSchemaInfo,
    } : LintCommandData) : LintManifestsResult
{
    const packageResult = manifestPackage.exportResult();

    // myLogger.info(">>>>>>>>>>>>>>>>>>>>>>>");
    // myLogger.info("RESULT: ", packageResult);
    // myLogger.info(">>>>>>>>>>>>>>>>>>>>>>>");

    const success = packageResult.severity == 'pass' || packageResult.severity == 'warning';

    myLogger.info("Success: %s", success);

    const result: LintManifestsResult = {
        success: success,
        severity: packageResult.severity,

        packageResult: packageResult,

        targetK8sVersion: k8sSchemaInfo.targetVersion || undefined,
        selectedK8sVersion: k8sSchemaInfo.selectedVersion || undefined,
        foundK8sVersion: k8sSchemaInfo.found,
        foundExactK8sVersion: k8sSchemaInfo.foundExact,

        counters: calculateManifestPackageCounters(packageResult)
    };

    //     outputSource.manifests = 
    //         _.chain(outputSource.manifests)
    //         .orderBy([x => x.namespace, x => x.api, x => x.version, x => x.kind, x => x.name])
    //         .value();

    // result.sources = 
    //     _.chain(result.sources)
    //      .orderBy([x => x.kind, x => x.path])
    //      .value();

    return result;
}