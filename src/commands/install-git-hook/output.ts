import { print, printErrorLine, printErrors, printInfoLine, printProcessStatus } from '../../screen';
import { InstallHookCommandData } from './types';


export function output(result: InstallHookCommandData)
{

    for(const step of result.steps)
    {
        if (step.success) {
            printInfoLine(step.name, 3);
        } else {
            printErrorLine(step.name, 3);
        }
    }

    printProcessStatus(result.success, 'Install Git Hook');

    printErrors(result.errors, 3);
}
