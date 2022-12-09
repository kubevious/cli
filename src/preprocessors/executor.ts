import { ILogger } from "the-logger";
import { Promise as MyPromise } from "the-promise";

import { exec } from 'child_process';
import Path from "path";
import { InputSource } from "../manifests/input-source";
import { spinOperation } from '../screen/spinner';
import { ManifestLoader } from "../manifests/manifests-loader";
import { ManifestSource } from "../manifests/manifest-source";
import { ManifestPackage } from "../manifests/manifest-package";

export class PreProcessorExecutor
{
    private _logger: ILogger;
    private _manifestsLoader: ManifestLoader;
    private _manifestPackage: ManifestPackage;

    constructor(logger: ILogger, manifestsLoader: ManifestLoader)
    {
        this._logger = logger.sublogger("PreProcessorExecutor");
        this._manifestsLoader = manifestsLoader;
        this._manifestPackage = manifestsLoader.manifestPackage;
    }

    async execute(inputSource: InputSource, source: ManifestSource) : Promise<void>
    {
        if (inputSource.preprocessor === 'kustomize')
        {
            await this._kustomize(inputSource, source);
        }

        if (inputSource.preprocessor === 'helm')
        {
            await this._helm(inputSource, source);
        }
    }

    private async _kustomize(inputSource: InputSource, source: ManifestSource)
    {
        const dirName = Path.dirname(inputSource.path);

        source = source.getSource("kustomize", dirName, source.originalSource);

        try
        {
            const command = `kustomize build ${dirName}`;
            const contents = await await this.executeCommand(command);
            if (!contents) {
                this._manifestPackage.sourceError(source, `Could not extract manifest contents from ${inputSource.preprocessor}`);
            } else {
                this._manifestsLoader.parseContents(source, "manifests.yaml", contents);
            }
        }
        catch(reason : any)
        {
            this._logger.info("[_loadFile] ERROR: ", reason);
            this._manifestPackage.sourceError(source, `Failed to extract manifest from ${inputSource.preprocessor}. Reason: ${reason?.message ?? "Unknown"}`);
        }
    }

    private async _helm(inputSource: InputSource, source: ManifestSource)
    {
        const dirName = Path.dirname(inputSource.path);
        source = source.getSource("helm", dirName, source.originalSource);

        try
        {
            const command = `helm template ${dirName}`;
            const contents = await await this.executeCommand(command);
            if (!contents) {
                this._manifestPackage.sourceError(source, `Could not extract manifest contents from ${inputSource.preprocessor}`);
            } else {
                this._manifestsLoader.parseContents(source, "manifests.yaml", contents);
            }
        }
        catch(reason : any)
        {
            this._logger.info("[_loadFile] ERROR: ", reason);
            this._manifestPackage.sourceError(source, `Failed to extract manifest from ${inputSource.preprocessor}. Reason: ${reason?.message ?? "Unknown"}`);
        }
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