import chalk from 'chalk';
import emoji from 'node-emoji';

import { GuardResult } from "./types";
import { output as lintOutput, outputLintResult, outputLintSummary, produceSourceLine } from '../lint/output'
import { outputManifest, print, severityStatusIcon } from '../lint/output'

export function output(result: GuardResult)
{
    lintOutput(result.lintResult, {
        skipSummary: true,
    });

    print();

    if (result.rules)
    {
        for(const rule of result.rules)
        {
            if (rule.namespace)
            {
                print(`${emoji.get('scroll')} [${rule.kind}] Namespace: ${rule.namespace}, ${rule.rule}`);
            }
            else
            {
                print(`${emoji.get('scroll')} [${rule.kind}] ${rule.rule}`);
            }

            print(produceSourceLine(rule.source), 3);
            
            if (!rule.compiled)
            {
                print(`${severityStatusIcon('fail')} Failed to compile`, 3);
            }

            if (rule.errors)
            {
                for(const error of rule.errors)
                {
                    print(`${emoji.get(':red_circle:')} ${error}`, 6);
                } 
            }

            if (rule.pass && rule.compiled)
            {
                if (rule.passed.length > 0)
                {
                    print(`${severityStatusIcon('pass')} Rule passed`, 3);
                }
                else
                {
                    print(`${severityStatusIcon('pass')} Rule passed. No manifests found to check.`, 3);
                }
            }

            if (!rule.pass)
            {
                print(`${severityStatusIcon('fail')} Rule failed`, 3);
            }

            // print(`${emoji.get('page_with_curl')} Rule: ${rule.rule}`);

            if (rule.passed.length > 0)
            {
                print(chalk.underline('Passed:'), 3);
                for(const manifest of rule.passed)
                {
                    outputManifest(manifest.manifest, severityStatusIcon('pass'), 6);
                    print(produceSourceLine(manifest.source), 9);
                } 
            }

            if (rule.violations)
            {
                print(chalk.underline('Violations:'), 3);

                for(const violation of rule.violations)
                {
                    outputManifest(violation.manifest, severityStatusIcon('fail'), 6);
                    print(produceSourceLine(violation.source), 9);
                    if (violation.errors)
                    {
                        for(const error of violation.errors)
                        {
                            print(`${emoji.get(':red_circle:')} ${error}`, 9);
                        }
                    }
                    if (violation.warnings)
                    {
                        for(const warn of violation.warnings)
                        {
                            print(`${severityStatusIcon('warning')} ${warn}`, 9);
                        }
                    }
                } 
            }

            print();
        }

        print();
    }

    outputLintSummary(result.lintResult);
    print();

    outputGuardSummary(result);
    print();

    outputLintResult(result.lintResult);
    print();

    if (result.success)
    {
        print(`${emoji.get('white_check_mark')} Guard Succeeded.`);
    }
    else
    {
        print(`${emoji.get('x')} Guard Failed`);
    }
}

export function outputGuardSummary(result: GuardResult)
{
    print(chalk.underline('Guard Summary'));

    print(`Rules: ${result.counters.rules.total}`, 4);
    print(`${severityStatusIcon('pass')} Rules Passed: ${result.counters.rules.passed}`, 8);
    print(`${emoji.get(':red_circle:')} Rules Failed: ${result.counters.rules.failed}`, 8);
    print(`${severityStatusIcon('fail')} Rules With Errors: ${result.counters.rules.withErrors}`, 8);
    print(`${severityStatusIcon('warning')} Rules With Warnings: ${result.counters.rules.withWarnings}`, 8);

    print(`Manifests: ${result.counters.manifests.total}`, 4);
    print(`${emoji.get('page_facing_up')} Manifests Processed: ${result.counters.manifests.processed}`, 8);
    print(`${severityStatusIcon('pass')} Manifests Passed: ${result.counters.manifests.passed}`, 8);
    print(`${severityStatusIcon('fail')} Manifests with Errors: ${result.counters.manifests.withErrors}`, 8);
    print(`${severityStatusIcon('warning')} Manifests with Warnings: ${result.counters.manifests.withWarnings}`, 8);
}
