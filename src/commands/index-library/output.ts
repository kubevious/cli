import { IndexLibraryResult } from "./types";
import { OBJECT_ICONS, print, printProcessStatus, printSectionTitle, printSubTitle } from '../../screen';

import { output as guardOutput } from '../guard/output'

export function output(result: IndexLibraryResult)
{
    guardOutput(result.guardResult);

    print();

    printSubTitle('Rule Library');
    print(`Rule Count: ${result.library.count}`)
    print(`Category Count: ${result.library.categoryCount}`)
    print();

    for(const category of result.library.categories)
    {
        print(`${OBJECT_ICONS.ruleCategory.get()} ${category.name}`, 2);
        print(`Rule Count: ${category.count}`, 5)
        for(const rule of category.rules)
        {
            print(`${OBJECT_ICONS.rule.get()} ${rule.title}`, 5);
            print(`Name: ${rule.name}`, 9);
            print(`Path: ${rule.path}`, 9);
            print();
        }
    }

    print(`Library Index: ${result.libraryPath}`);

    printProcessStatus(result.success ? 'pass' : 'fail', 'Index Generation');
}
