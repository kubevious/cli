import { IndexLibraryResult } from "./types";
import { OBJECT_ICONS, print, printProcessStatus, printSubTitle } from '../../screen';

import { output as guardOutput } from '../guard/output'

export function output(result: IndexLibraryResult)
{
    guardOutput(result.guardResult);

    print();

    printSubTitle('Rule Library');
    print(`Rule Count: ${result.library.count}`)
    print(`Location Count: ${result.library.locationCount}`)
    print();

    for(const location of result.library.locations)
    {
        print(`${OBJECT_ICONS.ruleLocation.get()} ${location.name}`, 2);
        print(`Rule Count: ${location.count}`, 5)
        for(const rule of location.rules)
        {
            print(`${OBJECT_ICONS.rule.get()} ${rule.title}`, 5);
            if (rule.categories.length > 0) {
                print(rule.categories.map(x => `${OBJECT_ICONS.ruleCategory.get()} ${x}`).join(' '), 9);
            }
            print(`Name: ${rule.name}`, 9);
            print(`Path: ${rule.path}`, 9);
            print();
        }
    }

    print(`Library Index: ${result.libraryPath}`);

    printProcessStatus(result.success ? 'pass' : 'fail', 'Index Generation');
}
