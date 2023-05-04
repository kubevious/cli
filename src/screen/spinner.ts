import _ from 'the-lodash';
// TODO: Temporarily Disabled Due To Compilation Issue
// import ora from 'ora';
import { indentify } from './';

export function spinOperation(name: string, indent?: number) : ISpinner
{
    // TODO: Temporarily Disabled Due To Compilation Issue
    // const spinner = ora(indentify(name ?? "", indent)).start();
    // spinner.spinner = 'moon';
    return {
        update: (newName: string) => {
            // TODO: Temporarily Disabled Due To Compilation Issue
            // spinner.text = indentify(newName ?? "", indent);
        },
        complete: (newName?: string) => {
            // TODO: Temporarily Disabled Due To Compilation Issue
            // spinner.succeed(indentify(newName ?? "", indent));
        },
        fail: (err: string) => {
            // TODO: Temporarily Disabled Due To Compilation Issue
            // spinner.color = 'red';
            // spinner.fail(indentify(err ?? "", indent));
        }
    }
}




export interface ISpinner
{
    update(newName: string) : void;
    complete(newName?: string) : void;
    fail(newName: string) : void;
}