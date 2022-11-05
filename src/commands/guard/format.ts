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
        ...lintResult,
        lintSuccess: lintResult.success,
        ruleSuccess: true,
        rules: []
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
            passed: rule.passed.map(x => ({
                manifest: x.id,
                source: x.source.source
            }))
        };

        if (rule.isHasErrors) {
            ruleResult.errors = rule.ruleErrors.map(x => x.msg);
        }

        if (rule.violations.length > 0)
        {
            result.ruleSuccess = false;
            ruleResult.pass = false;
            ruleResult.violations = [];

            for(const violation of rule.violations)
            {
                ruleResult.violations.push({
                    manifest: violation.manifest.id,
                    source: violation.manifest.source.source,
                    errors: violation.errors,
                    warnings: violation.warnings,
                });
            }
        }

        result.rules.push(ruleResult);
    }

    result.success = result.lintSuccess && result.ruleSuccess;

    return result;
}
