import { GuardResult } from "./types";
import { output as lintOutput, } from '../lint/output'
import { OBJECT_ICONS, print, printFailLine, printInactivePassLine, printInfoLine, printPassLine, printProcessStatus, printSectionTitle, printSubTitle, printSummaryCounter, printWarningLine, printWarnings, STATUS_ICONS } from '../../screen';
import { RuleEngineResult, RuleResult } from "../../types/rules-result";
import { outputManifestResult, outputManifestResultSources, outputMessages } from "../../screen/manifest";


export function output(result: GuardResult, detailed?: boolean)
{
    detailed = detailed ?? false;

    lintOutput(result.lintResult, detailed, {
        skipSummary: true,
        skipResult: true,
    });

    outputRuleEngineResult(result.rules, detailed, 0);

    outputGuardSummary(result);

    if (!detailed) {
        print();
        printInfoLine(`Run with --detailed to see all sources and manifests`);
    }

    printProcessStatus(result.severity, 'Guard');
}


export function outputGuardSummary(result: GuardResult)
{
    printSectionTitle('Summary');

    const lintCounters = result.lintResult.counters;
    const guardCounters = result.counters;

    print(`${OBJECT_ICONS.source.get()} Sources: ${lintCounters.sources.total}`, 4);
    printSummaryCounter(STATUS_ICONS.failed, 'Sources with Errors', lintCounters.sources.withErrors);

    print(`${OBJECT_ICONS.manifest.get()} Manifests: ${lintCounters.manifests.total}`, 4);
    printSummaryCounter(STATUS_ICONS.passed, 'Valid Manifests', lintCounters.manifests.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Manifests with Errors', lintCounters.manifests.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Manifests with Warnings', lintCounters.manifests.withWarnings);
    printSummaryCounter(STATUS_ICONS.passed, 'Manifests Processed for Rules', guardCounters.manifests.processed);
    printSummaryCounter(STATUS_ICONS.failed, 'Manifests with Rule Errors', guardCounters.manifests.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Manifests with Rule Warnings', guardCounters.manifests.withWarnings);

    print(`${OBJECT_ICONS.rule.get()} Rules: ${guardCounters.rules.total}`, 4);
    printSummaryCounter(STATUS_ICONS.passed, 'Rules Passed', guardCounters.rules.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Rules Failed', guardCounters.rules.failed);
    printSummaryCounter(STATUS_ICONS.error, 'Rules with Errors', guardCounters.rules.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Rules with Warnings', guardCounters.rules.withWarnings);
}

function outputRuleEngineResult(rules: RuleEngineResult, detailed: boolean, indent: number)
{ 
    const nestedIndent = indent + 3;

    printSectionTitle('Rules', indent);

    if (rules.rules.length === 0)
    {
        printWarningLine('No Rules found.', nestedIndent)
    }
    else
    {
        if (!detailed && (rules.severity == 'pass'))
        {
            printPassLine('No issues with rules.', nestedIndent);
        }
        else
        {
            for(const rule of rules.rules)
            {
                outputRuleResult(rule, detailed, nestedIndent);
            }
        }
    }

    print();
}

function outputRuleResult(rule: RuleResult, detailed: boolean, indent: number)
{
    if (!detailed) {
        if (rule.ruleSeverity === 'pass') {
            return;
        }
    }

    const nestedIndent = indent + 3;
    
    if (rule.namespace)
    {
        print(`${OBJECT_ICONS.rule.get()} [${rule.ruleManifest.kind}] Namespace: ${rule.namespace}, ${rule.ruleManifest.name}`, indent);
    }
    else
    {
        print(`${OBJECT_ICONS.rule.get()} [${rule.ruleManifest.kind}] ${rule.ruleManifest.name}`, indent);
    }

    if (rule.ruleCategories.length > 0) {
        print(rule.ruleCategories.map(x => `${OBJECT_ICONS.ruleCategory.get()} ${x}`).join(' '), nestedIndent);
    }

    outputManifestResultSources(rule.ruleManifest, nestedIndent, { hideSeverityIcon: true });

    if (rule.isSkipped)
    {
        printInactivePassLine('Rule skipped.', nestedIndent);
    }
    else
    {
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
    }

    if (!rule.pass)
    {
        printFailLine('Rule failed', nestedIndent)
    }

    if (rule.passed.length > 0)
    {
        printSubTitle('Passed:', nestedIndent);
        for(const manifest of rule.passed)
        {
            outputManifestResult(manifest, detailed, nestedIndent + 3);
        } 
    }

    if (rule.violations.length > 0)
    {
        printSubTitle('Violations:', nestedIndent);

        for(const violation of rule.violations)
        {
            outputManifestResult(violation, detailed, nestedIndent + 3);
        } 
    }

    print();
}
