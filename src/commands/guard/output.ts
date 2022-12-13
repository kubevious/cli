import { GuardResult } from "./types";
import { output as lintOutput, outputLintResult } from '../lint/output'
import { OBJECT_ICONS, print, printProcessStatus, printSectionTitle, printSummaryCounter, STATUS_ICONS } from '../../screen';
import { outputManifestPackageCounters } from "../../screen/counters";


export function output(result: GuardResult)
{
    lintOutput(result.lintResult, {
        skipSummary: true,
    });

    print();

    // if (result.rules)
    // {
    //     for(const rule of result.rules)
    //     {
    //         if (rule.namespace)
    //         {
    //             print(`${OBJECT_ICONS.rule.get()} [${rule.kind}] Namespace: ${rule.namespace}, ${rule.rule}`);
    //         }
    //         else
    //         {
    //             print(`${OBJECT_ICONS.rule.get()} [${rule.kind}] ${rule.rule}`);
    //         }

    //         print(produceSourceLine(rule.source), 3);
            
    //         if (!rule.compiled)
    //         {
    //             printFailLine(`Failed to compile`, 3);
    //         }

    //         printErrors(rule.errors, 6);

    //         if (rule.pass && rule.compiled)
    //         {
    //             if (rule.passed.length > 0)
    //             {
    //                 printPassLine('Rule passed', 3);
    //             }
    //             else
    //             {
    //                 printInactivePassLine('Rule passed. No manifests found to check.', 3);
    //             }
    //         }

    //         if (!rule.pass)
    //         {
    //             printFailLine('Rule failed', 3)
    //         }

    //         if (rule.passed.length > 0)
    //         {
    //             printSectionTitle('Passed:', 3);
    //             for(const manifest of rule.passed)
    //             {
    //                 outputManifest(manifest.manifest, STATUS_ICONS.passed, 6);
    //                 print(produceSourceLine(manifest.source), 9);
    //             } 
    //         }

    //         if (rule.violations)
    //         {
    //             printSectionTitle('Violations:', 3);

    //             for(const violation of rule.violations)
    //             {
    //                 outputManifest(violation.manifest, STATUS_ICONS.failed, 6);
    //                 print(produceSourceLine(violation.source), 9);

    //                 printErrors(violation.errors, 9);
    //                 printWarnings(violation.warnings, 9);
    //             } 
    //         }

    //         print();
    //     }

    //     print();
    // }

    outputGuardSummary(result);

    outputLintResult(result.lintResult);

    printProcessStatus(result.severity, 'Guard');
}


export function outputGuardSummary(result: GuardResult)
{
    printSectionTitle('Summary');

    outputManifestPackageCounters(result.lintResult.counters);

    print(`Rules: ${result.counters.rules.total}`, 4);
    printSummaryCounter(STATUS_ICONS.passed, 'Rules Passed', result.counters.rules.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Rules Failed', result.counters.rules.failed);
    printSummaryCounter(STATUS_ICONS.error, 'Rules With Errors', result.counters.rules.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Rules With Warnings', result.counters.rules.withWarnings);
    
    print(`Manifests: ${result.counters.manifests.total}`, 4);
    printSummaryCounter(OBJECT_ICONS.manifest, 'Manifests Processed', result.counters.manifests.processed);
    printSummaryCounter(STATUS_ICONS.passed, 'Manifests Passed', result.counters.manifests.passed);
    printSummaryCounter(STATUS_ICONS.failed, 'Manifests with Errors', result.counters.manifests.withErrors);
    printSummaryCounter(STATUS_ICONS.warning, 'Manifests With Warnings', result.counters.manifests.withWarnings);
}
