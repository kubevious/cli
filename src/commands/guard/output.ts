import chalk from 'chalk';
import emoji from 'node-emoji';

import { GuardResult } from "./types";
import { output as lintOutput } from '../lint/output'
import { outputManifest, print, severityStatusIcon } from '../lint/output'

export function output(result: GuardResult)
{
    lintOutput(result, true);

    if (result.rules)
    {
        for(const rule of result.rules)
        {
            print(`${emoji.get('page_with_curl')} Rule: ${rule.rule}`);
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
                print(`${severityStatusIcon('pass')} Rule passed`, 3);
            }

            if (!rule.pass)
            {
                print(`${severityStatusIcon('fail')} Rule failed`, 3);
            }

            // print(`${emoji.get('page_with_curl')} Rule: ${rule.rule}`);

            if (rule.violations)
            {
                
                print(chalk.underline('Violations:'), 3);

                for(const violation of rule.violations)
                {
                    outputManifest(violation.manifest, severityStatusIcon('fail'), 6);
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

    if (result.success)
    {
        print(`${emoji.get('white_check_mark')} Guard Succeeded.`);
    }
    else
    {
        print(`${emoji.get('x')} Guard Failed`);
    }
}

