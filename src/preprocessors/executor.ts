import _ from 'the-lodash';
import { ILogger } from "the-logger";
import { Promise as MyPromise } from "the-promise";

import { exec } from 'child_process';
import Path from "path";
import { InputSource, InputSourceKind } from "../input/input-source";
import { spinOperation } from '../screen/spinner';
import { ManifestLoader } from "../manifests/manifests-loader";
import { ManifestSource } from "../manifests/manifest-source";
import { ManifestPackage } from "../manifests/manifest-package";
import YAML from "yaml";
import fs from 'fs';

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
                source.reportError(`Could not extract manifest contents from ${inputSource.preprocessor}`);
            } else {
                this._manifestsLoader.parseContents(source, "manifests.yaml", contents);
            }
        }
        catch(reason : any)
        {
            this._logger.info("[_loadFile] ERROR: ", reason);
            source.reportError(`Failed to extract manifest from ${inputSource.preprocessor}. Reason: ${reason?.message ?? "Unknown"}`);
        }
    }

    private async _helm(inputSource: InputSource, source: ManifestSource)
    {
        this._logger.info("[_helm] path: %s, file: %s", inputSource.path, inputSource.file);

        let helmChartName = "";
        let helmChartPath = inputSource.path;

        const isLocalChart = fs.existsSync(helmChartPath);
        this._logger.info("[_helm] isLocalChart: %s", isLocalChart);

        if (isLocalChart)
        {
            let chartYamlFilePath : string = helmChartPath;
            if (isDir(helmChartPath))
            {
                chartYamlFilePath = Path.join(chartYamlFilePath, 'Chart.yaml');
            }
            this._logger.info("[_helm] chartYamlFilePath: %s", chartYamlFilePath);
            
            try
            {
                const contents = await this._manifestsLoader.rawReadFile(chartYamlFilePath);
                const chart = YAML.parseDocument(contents).toJS({});
                helmChartName = chart.name;
            }
            catch(reason : any)
            {
                this._logger.info("[_helm] ERROR: ", reason);
                source.reportError('Failed to load Helm Chart manifest. Reason: ' + (reason?.message ?? "Unknown"));
                return;
            }
            this._logger.info("[_helm] helmChartName: %s", helmChartName);

            if(!helmChartName) {
                source.reportError('Invalid Helm Chart manifest. Chart name not set.');
                return;
            }

            helmChartPath = Path.dirname(chartYamlFilePath);
        }
        else if (inputSource.kind === InputSourceKind.helm)
        {
            helmChartPath = inputSource.path;
        }

        this._logger.info("[_helm] helmChartPath: %s", helmChartPath);

        if (source.id.kind !== 'helm') {
            source = source.getSource("helm", helmChartPath, source.originalSource, !isLocalChart);
        }

        try
        {
            let command = `helm template`;
            for(const suffix of inputSource.suffixes)
            {
                if (suffix.key === 'values') {
                    command += ` --values ${suffix.value}`
                }
                else if (suffix.key === 'namespace') {
                    command += ` --namespace ${suffix.value}`
                } 
                else if (suffix.key === 'release-name') {
                    command += ` --release-name ${suffix.value}`
                } 
                else if (suffix.key === 'crds') {
                    if (suffix.value === 'include') {
                        command += ` --include-crds`;
                    } else if (suffix.value === 'skip') {
                        command += ` --skip-crds`;
                    } else {
                        source.reportError(`Unknown preprocessor key provided: ${suffix.key}=${suffix.value}`);
                    }
                }
                else
                {
                    source.reportError(`Unknown preprocessor key provided: ${suffix.key}`);
                }
            }
            if (source.selfErrors.length > 0) {
                return;
            }

            command += ` ${helmChartPath}`;
            
            const contents = await await this.executeCommand(command);
            if (!contents)
            {
                source.reportError(`Could not extract manifest contents from ${inputSource.preprocessor}`);
            }
            else
            {
                try
                {
                    const rawYamls = this._manifestsLoader.parseYamlRaw(contents);
                    for(const rawYaml of rawYamls)
                    {
                        this._processHelm(inputSource, source, rawYaml, helmChartName, isLocalChart);
                    }
                }
                catch(reason: any)
                {
                    source.reportError(`Failed to parse YAML manifests from ${inputSource.preprocessor}. Reason: ${reason?.message ?? "Unknown"}`);
                    return;
                }
            }
        }
        catch(reason : any)
        {
            this._logger.info("[_helm] ERROR: ", reason);
            source.reportError(`Failed to extract manifest from ${inputSource.preprocessor}. Reason: ${reason?.message ?? "Unknown"}`);
        }
    }

    private _processHelm(inputSource: InputSource,
                         source: ManifestSource,
                         rawYaml: YAML.Document.Parsed<YAML.ParsedNode>,
                         helmChartName : string,
                         isLocalChart: boolean)
    {
        const comment = rawYaml.contents?.commentBefore;

        this._logger.info("[_processHelm] comment: %s", comment);
        if (comment)
        {
            const matches = comment.match(/Source: (\S*)$/);
            if (matches)
            {
                let templatePath = matches[1];
                this._logger.info("[_processHelm] templatePath: %s", templatePath);

                if (isLocalChart)
                {
                    if (helmChartName && helmChartName.length > 0)
                    {
                        if (_.last(helmChartName) !== '/') {
                            helmChartName += '/';
                        }
        
                        if (templatePath.startsWith(helmChartName)) {
                            templatePath = templatePath.substring(helmChartName.length);
                        }
                    }
                }

                source = source.getSource('file', templatePath, source.originalSource, !isLocalChart);
            }
        }

        const config = this._manifestsLoader.rawYamlToObj(rawYaml);
        this._manifestsLoader.addManifest(source, config);
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

function isDir(path: string)
{
    const stats = fs.statSync(path);
    return stats.isDirectory();
}