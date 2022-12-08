import { ILogger } from "the-logger";
import { Promise as MyPromise } from "the-promise";

import { exec } from 'child_process';
import Path from "path";
import { InputSource } from "../manifests/input-source";
import { spinOperation } from '../screen/spinner';

export class PreProcessorExecutor
{
    private _logger: ILogger;

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger("PreProcessorExecutor");
    }

    async extract(inputSource: InputSource) : Promise<string | null>
    {
        if (inputSource.preprocessor === 'kustomize')
        {
            return await this._kustomize(inputSource);
        }

        return null;
    }

    private async _kustomize(inputSource: InputSource) : Promise<string | null>
    {
        const dirName = Path.dirname(inputSource.path);
        const result = await this.executeCommand(`kustomize build ${dirName}`);
        return result;
    }


    async executeCommand(command: string) : Promise<string | null>
    {
        this._logger.info("EXECUTING: %s", command);

        const spinner = spinOperation(`Executing ${command}`);
        try 
        {
            const result : string = await MyPromise.construct((resolve, reject) => {

                exec(command, (err, output) => {
                    // once the command has completed, the callback function is called
                    if (err) {
                        // log and return if we encounter an error
                        this._logger.error("ERROR: %s", output)
                        reject(err);
                        return;
                    }
                    // log the output received from the command
                    // this._logger.info("Output: %s", output)
                    resolve(output);
                })

            });

            spinner.complete(`Succeeded: ${command}`);

            return result;
        }
        catch(reason)
        {
            spinner.fail(`Command Failed: ${command}`);
            throw reason;
        }

        return null;

    }
}