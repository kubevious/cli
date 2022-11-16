import { IndexLibraryResult } from "./types";
import { OBJECT_ICONS, print, printProcessStatus, printSectionTitle } from '../../screen';

import { output as guardOutput } from '../guard/output'

export function output(result: IndexLibraryResult)
{
    guardOutput(result.guardResult);

    print();

    printSectionTitle('Rule Library');
    print();

    for(const rule of result.libraryRules)
    {
        print(`${OBJECT_ICONS.rule.get()} ${rule.name}`, 2);
        print(`Path: ${rule.path}`, 5);
        print();
    }

    print(`Library Index: ${result.libraryPath}`);

    printProcessStatus(result.success, 'Index Generation');
}
