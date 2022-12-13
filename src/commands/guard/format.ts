import _ from 'the-lodash';

import { GuardCommandData, GuardResult } from "./types";
import { logger } from '../../logger';

import { calculateRuleEngineCounters } from '../../manifests/counters';

const myLogger = logger.sublogger('GuardFormat');

export function formatResult({
        ruleSuccess,
        manifestPackage,
        k8sSchemaInfo,
        rulesRuntime,
        lintResult
    } : GuardCommandData) : GuardResult
{

    const success = lintResult.success;

    myLogger.info("RuleSuccess: %s", ruleSuccess);
    myLogger.info("LintResult.success: %s", lintResult.success);

    const rulesResult = rulesRuntime.exportResult();

    const result: GuardResult = {
        success: success,
        severity: lintResult.severity,
        ruleSuccess: ruleSuccess,

        lintResult : lintResult,
        rules: rulesResult,

        counters: calculateRuleEngineCounters(rulesResult, manifestPackage)
    };

    logger.info("XXX: ", rulesResult);
    logger.info("COUNTERS: ", result.counters);

    return result;
}
