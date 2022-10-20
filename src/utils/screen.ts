import ora from 'ora';

export function spinOperation(name: string) : ISpinner
{
    const spinner = ora(name).start();
    // spinner.spinner = 'moon';
    return {
        update: (newName: string) => {
            spinner.text = newName;
        },
        complete: (newName?: string) => {
            spinner.succeed(newName);
        },
        fail: (err: string) => {
            // spinner.color = 'red';
            spinner.fail(err);
        }
    }
}

export interface ISpinner
{
    update(newName: string) : void;
    complete(newName?: string) : void;
    fail(newName: string) : void;
}