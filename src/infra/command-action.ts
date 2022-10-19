import { program } from 'commander';
import _ from 'the-lodash';
import { logger } from '../logger';

export type ActionFunc<TData> = (...args: any[]) => TData | Promise<TData>;
export type FormatFunc<TData, TResult> = (data: TData) => TResult;
export type OutputFunc<TResult> = (result: TResult) => void;
export type DesideSuccess<TResult> = (result: TResult) => number;

export class CommandBuilder<TData, TResult>
{
    private _action?: ActionFunc<TData>;
    private _format?: FormatFunc<TData, TResult>;
    private _output?: OutputFunc<TResult>;
    private _decideSuccess?: DesideSuccess<TResult>;

    constructor()
    {

    }

    perform(action: ActionFunc<TData>)
    {
        this._action = action;
        return this;
    }

    format(format: FormatFunc<TData, TResult>)
    {
        this._format = format;
        return this;
    }

    output(output: OutputFunc<TResult>)
    {
        this._output = output;
        return this;
    }

    decideSuccess(decideSuccess: DesideSuccess<TResult>)
    {
        this._decideSuccess = decideSuccess;
        return this;
    }

    build()
    {
        return (...args: any[]) => {
            // logger.info("ARG LENGTH: %s", args.length);
            // logger.info("args: ", args);

            const options = _.last(_.dropRight(args)) || {};
            logger.info("OPTIONS: ", options);
            
            let myResult: TResult | undefined = undefined;

            return Promise.resolve(null)
                .then(() => {
                    if (!this._action) {
                        throw new Error("Action not specified");
                    }
                    return this._action(...args);
                })
                .then((data: TData) => {
                    if (!this._format) {
                        throw new Error("Format not specified");
                    }
                    return this._format(data)
                })
                .then((result: TResult) => {
                    myResult = result;

                    if (options.json) {
                        console.log(JSON.stringify(result, null, 4));
                    } else {
                        if (this._output) {
                            return this._output(result);
                        }
                    }
                })
                .then(() => {
                    if (this._decideSuccess) {
                        const exitCode = this._decideSuccess(myResult!);
                        if (exitCode !== 0) {
                            process.exit(exitCode);
                        }
                    }
                })
                .catch(reason => {
                    console.log(`Error executing command. ${reason?.message}`);
                    process.exit(111);
                })
                .then(() => {})
                ;
        };
    }


}
