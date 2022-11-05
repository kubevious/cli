import _ from 'the-lodash';

import { GuardResult,  LintRuleResult } from "./types";
import { logger } from '../../logger';
import { ManifestPackage } from '../../tools/manifest-package';
import { K8sApiSchemaFetcherResult } from '../../tools/k8s-api-schema-fetcher';
import { RulesRuntime } from '../../tools/rules-engine/rules-runtime';

import { formatResult as lintFormatResult } from '../lint/format';

export function formatResult(
    manifestPackage: ManifestPackage,
    schemaInfo: K8sApiSchemaFetcherResult,
    rulesRuntime: RulesRuntime
    ) : GuardResult
{
    const lintResult = lintFormatResult(manifestPackage, schemaInfo);

    const result: GuardResult = {
        success: true,
        lintResult : lintResult,
        ruleSuccess: true,
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
                total: 0,
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
            compiled: rule.isCompiled && !rule.isHasErrors,
            pass: true,
            hasViolationErrors: false,
            hasViolationWarnings: false,
            passed: rule.passed.map(x => ({
                manifest: x.id,
                source: x.source.source
            }))
        };

        if (rule.isHasErrors) {
            ruleResult.errors = rule.ruleErrors.map(x => x.msg);
            result.counters.rules.failed++;
        }

        if (rule.violations.length > 0)
        {
            ruleResult.violations = [];


            for(const violation of rule.violations)
            {
                if (violation.hasErrors) {
                    result.ruleSuccess = false;
                    ruleResult.pass = false;
                    ruleResult.hasViolationErrors = true;
                }
                if (violation.hasWarnings) {
                    ruleResult.hasViolationWarnings = true;
                }

                ruleResult.violations.push({
                    manifest: violation.manifest.id,
                    source: violation.manifest.source.source,
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

    result.success = result.lintResult.success && result.ruleSuccess;

    return result;
}
