import _ from 'the-lodash';

import { GuardCommandData, GuardResult } from "./types";
import { logger } from '../../logger';

import { calculateRuleEngineCounters } from '../../manifests/counters';

const myLogger = logger.sublogger('GuardFormat');

export function formatResult({
        severity,
        manifestPackage,
        k8sSchemaInfo,
        rulesRuntime,
        lintResult,
        rulesResult,
    } : GuardCommandData) : GuardResult
{
    myLogger.info("Severity:  %s", severity);

    myLogger.info("LintResult Severity:  %s", lintResult.severity);
    myLogger.info("LintResult Success: %s", lintResult.success);

    myLogger.info("RulesResult Severity:  %s", rulesResult.severity);
    myLogger.info("RulesResult Success: %s", rulesResult.success);

    const success = (severity == 'pass') || (severity == 'warning');

    const result: GuardResult = {
        success: success,
        severity: severity,

        lintResult : lintResult,
        rules: rulesResult,

        counters: calculateRuleEngineCounters(rulesResult, manifestPackage)
    };

    logger.info("RULES RESULT: ", rulesResult);
    logger.info("RULE COUNTERS: ", result.counters);

    return result;
}
