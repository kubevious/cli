import _ from 'the-lodash';

import { GuardCommandData, GuardResult,  LintRuleResult } from "./types";
import { logger } from '../../logger';

import { formatResult as lintFormatResult } from '../lint/format';

const myLogger = logger.sublogger('GuardFormat');

export function formatResult({
        success,
        ruleSuccess,
        manifestPackage,
        k8sSchemaInfo,
        rulesRuntime,
        lintCommandData
    } : GuardCommandData) : GuardResult
{
    const lintResult = lintFormatResult(lintCommandData);

    myLogger.info("Success: %s", success);
    myLogger.info("RuleSuccess: %s", ruleSuccess);
    myLogger.info("LintResult.success: %s", lintResult.success);

    const result: GuardResult = {
        success: success,
        ruleSuccess: ruleSuccess,
        lintResult : lintResult,
        rules: [],

        counters: {
            rules: {
                total: rulesRuntime.rules.length,
                passed: 0,
                failed: 0,
                withErrors: 0,
                withWarnings: 0
            },
            manifests: {
                total: manifestPackage.manifests.length,
                processed: 0,
                passed: 0,
                withErrors: 0,
                withWarnings: 0
            }
        }
    };

    for(const rule of rulesRuntime.rules)
    {
        const ruleResult : LintRuleResult = {
            source: rule.rule.source,
            kind: rule.rule.kind,
            namespace: rule.rule.namespace,
            rule: rule.rule.name,
            compiled: rule.isCompiled && !rule.hasRuntimeErrors,
            pass: true,
            hasViolationErrors: false,
            hasViolationWarnings: false,
            passed: rule.passed.map(x => ({
                manifest: x.id,
                source: x.source.id
            }))
        };

        ruleResult.errors = rule.ruleErrors.map(x => x.msg) ?? [];

        if (!ruleResult.compiled) {
            result.counters.rules.failed++;
        }

        if (rule.violations.length > 0)
        {
            ruleResult.violations = [];

            for(const violation of rule.violations)
            {
                if (violation.hasErrors) {
                    ruleResult.pass = false;
                    ruleResult.hasViolationErrors = true;
                }
                if (violation.hasWarnings) {
                    ruleResult.hasViolationWarnings = true;
                }

                ruleResult.violations.push({
                    manifest: violation.manifest.id,
                    source: violation.manifest.source.id,
                    errors: violation.errors,
                    warnings: violation.warnings,
                });
            }
        }

        if (!ruleResult.compiled) {
            result.counters.rules.failed++;
        }
        if (ruleResult.passed) {
            result.counters.rules.passed++;
        }
        if (ruleResult.hasViolationErrors) {
            result.counters.rules.withErrors++;
        }
        if (ruleResult.hasViolationWarnings) {
            result.counters.rules.withWarnings++;
        }

        result.rules.push(ruleResult);
    }
    
    for(const manifest of manifestPackage.manifests)
    {
        if (manifest.rules.processed)
        {
            result.counters.manifests.processed++;
            if (manifest.rules.errors)
            {
                result.counters.manifests.withErrors++;
            }
            else
            {
                result.counters.manifests.passed++;
            }

            if (manifest.rules.warnings)
            {
                result.counters.manifests.withWarnings++;
            }
        }
    }


    return result;
}
