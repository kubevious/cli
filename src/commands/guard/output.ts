import { GuardResult } from "./types";
import { output as lintOutput, } from '../lint/output'
import { OBJECT_ICONS, print, printFailLine, printInactivePassLine, printPassLine, printProcessStatus, printSectionTitle, printSummaryCounter, printWarnings, STATUS_ICONS } from '../../screen';
import { RuleEngineResult, RuleResult } from "../../types/rules-result";
import { outputManifestResult, outputManifestResultSources, outputMessages } from "../../screen/manifest";


export function output(result: GuardResult)
{
    lintOutput(result.lintResult, {
        skipSummary: true,
        skipResult: true,
    });

    outputRuleEngineResult(result.rules);

    outputGuardSummary(result);

    printProcessStatus(result.severity, 'Guard');
}


export function outputGuardSummary(result: GuardResult)
{
    printSectionTitle('Summary');

    const lintCounters = result.lintResult.counters;
    const guardCounters = result.counters;

    print(`Sources: ${lintCounters.sources.total}`, 4);
    printSummaryCounter(STATUS_ICONS.failed, 'Sources with Errors', lintCounters.sources.withErrors);

    print(`Manifests: ${lintCounters.manifests.total}`, 4);
    printSummaryCounter(STATUS_ICONS.passed, 'Manifests Passed', lintCounters.manifests.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Manifests with Errors', lintCounters.manifests.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Manifests With Warnings', lintCounters.manifests.withWarnings);
    printSummaryCounter(OBJECT_ICONS.manifest, 'Manifests Processed for Rules', guardCounters.manifests.processed);
    printSummaryCounter(STATUS_ICONS.failed, 'Manifests with Rule Errors', guardCounters.manifests.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Manifests with RUle Warnings', guardCounters.manifests.withWarnings);

    print(`Rules: ${guardCounters.rules.total}`, 4);
    printSummaryCounter(STATUS_ICONS.passed, 'Rules Passed', guardCounters.rules.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Rules Failed', guardCounters.rules.failed);
    printSummaryCounter(STATUS_ICONS.error, 'Rules With Errors', guardCounters.rules.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Rules With Warnings', guardCounters.rules.withWarnings);
}

export function outputRuleEngineResult(rules: RuleEngineResult)
{ 
    printSectionTitle('RULES:');
    for(const rule of rules.rules)
    {
        outputRuleResult(rule);
    }
}

export function outputRuleResult(rule: RuleResult, indent?: number)
{
    const nestedIndent = (indent ?? 0) + 3;
    
    if (rule.namespace)
    {
        print(`${OBJECT_ICONS.rule.get()} [${rule.ruleManifest.kind}] Namespace: ${rule.namespace}, ${rule.ruleManifest.name}`, indent);
    }
    else
    {
        print(`${OBJECT_ICONS.rule.get()} [${rule.ruleManifest.kind}] ${rule.ruleManifest.name}`, indent);
    }

    outputManifestResultSources(rule.ruleManifest, nestedIndent);

    if (!rule.compiled)
    {
        printFailLine(`Failed to compile`, nestedIndent);
    }

    outputMessages(rule.ruleManifest, nestedIndent);

    if (rule.pass && rule.compiled)
    {
        if (rule.passed.length > 0)
        {
            printPassLine('Rule passed', nestedIndent);
        }
        else
        {
            printInactivePassLine('Rule passed. No manifests found to check.', nestedIndent);
        }
    }

    if (!rule.pass)
    {
        printFailLine('Rule failed', nestedIndent)
    }

    if (rule.passed.length > 0)
    {
        printSectionTitle('Passed:', nestedIndent);
        for(const manifest of rule.passed)
        {
            outputManifestResult(manifest, nestedIndent + 3);
        } 
    }

    if (rule.violations)
    {
        printSectionTitle('Violations:', nestedIndent);

        for(const violation of rule.violations)
        {
            outputManifestResult(violation, nestedIndent + 3);
        } 
    }

    print();
}
