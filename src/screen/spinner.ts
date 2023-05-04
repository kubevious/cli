import _ from 'the-lodash';
import ora from 'ora';
import { indentify } from './';

export function spinOperation(name: string, indent?: number) : ISpinner
{
    const spinner = ora(indentify(name ?? "", indent)).start();
    spinner.spinner = 'moon';
    return {
        update: (newName: string) => {
            spinner.text = indentify(newName ?? "", indent);
        },
        complete: (newName?: string) => {
            spinner.succeed(indentify(newName ?? "", indent));
        },
        fail: (err: string) => {
            spinner.color = 'red';
            spinner.fail(indentify(err ?? "", indent));
        }
    }
}




export interface ISpinner
{
    update(newName: string) : void;
    complete(newName?: string) : void;
    fail(newName: string) : void;
}