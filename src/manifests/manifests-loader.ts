import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise as MyPromise } from 'the-promise';
import axios from 'axios';
import * as fs from 'fs';
import * as Path from 'path';
import { K8sObject } from '../types/k8s';
import YAML from 'yaml';

import { ManifestPackage } from './manifest-package';
import { readFromInputStream } from '../utils/stream';
import { spinOperation } from '../screen/spinner';
import { K8sManifest } from './k8s-manifest';
import { ManifestSource } from "./manifest-source";
import { sanitizeYaml } from '../utils/k8s-manifest-sanitizer';
import { InputSourceExtractor } from './input-source-extractor';
import { InputSource, InputSourceKind } from './input-source';
import { PreProcessorExecutor } from '../preprocessors/executor';

export interface ManifestLoaderOptions
{
    ignoreNonK8s: boolean;
}

export class ManifestLoader
{
    private _logger: ILogger;
    private _manifestPackage: ManifestPackage;
    private _inputSourceExtractor : InputSourceExtractor;
    private _options: ManifestLoaderOptions;

    constructor(logger: ILogger, manifestPackage: ManifestPackage, inputSourceExtractor: InputSourceExtractor, options?: Partial<ManifestLoaderOptions>)
    {
        this._logger = logger.sublogger('ManifestLoader');
        this._manifestPackage = manifestPackage;
        this._inputSourceExtractor = inputSourceExtractor;

        options = options ?? {};
        this._options = {
            ignoreNonK8s: options.ignoreNonK8s ?? false
        };

        this._logger.info("setup. options: ", this._options);
    }

    get manifestPackage() {
        return this._manifestPackage;
    }

    get inputSourceExtractor() {
        return this._inputSourceExtractor;
    }

    public async loadFromExtractor()
    {
        this._logger.info("[load] BEGIN");

        const spinner = spinOperation('Loading manifests...');

        for(const originalSource of this._inputSourceExtractor.originalSources)
        {
            if (!originalSource.hasAnyInput) {
                const source = this._manifestPackage.getSource(originalSource.kind, originalSource.path, originalSource);
                this._manifestPackage.sourceError(source, `No input was found.`);
            }
        }

        const sources = this._inputSourceExtractor.sources;
        await MyPromise.serial(sources, x => MyPromise.resolve(this.loadSingle(x)));

        spinner.complete('Manifests loaded.');
    }

    public async loadFromStream()
    {
        this._logger.info("[_loadFromStream] ");
        const source = this._manifestPackage.getSource("stream", 'stream', null);

        try
        {
            const contents = await readFromInputStream();

            let manifests : any[] | null = null;
        
            if (!manifests) {
                try
                {
                    manifests = this._parseYaml(contents);
                }
                catch(reason: any)
                {
                    this._manifestPackage.sourceError(source, reason.message ?? 'Error parsing YAML.');
                }
            }

            if (!manifests) {
                try
                {
                    manifests = [JSON.parse(contents)];
                }
                catch(reason: any)
                {
                    manifests = null;
                }
            }                

            if (manifests)
            {
                for(const manifest of manifests)
                {
                    this._addManifest(source, manifest);
                }
            }
            else
            {
                this._manifestPackage.sourceError(source, 'Failed to parse manifests from stream.');
            }
        }
        catch(reason: any)
        {
            this._manifestPackage.sourceError(source, `Failed to fetch manifest. Reason: ${reason.message ?? 'unknown'}`);
        }
    }

    public async loadSingle(inputSource: InputSource, parentSource?: ManifestSource) : Promise<K8sManifest[]>
    {
        if (inputSource.isPreprocessor) {
            return await this._loadFromPreProcessor(inputSource, parentSource);
        }

        if (inputSource.kind == InputSourceKind.web)
        {
            return await this._loadUrl(inputSource, parentSource);
        }
        else
        {
            return await this._loadFile(inputSource, parentSource);
        }
    }

    private async _loadFromPreProcessor(inputSource: InputSource, parentSource?: ManifestSource) : Promise<K8sManifest[]>
    {
        const source = this._manifestPackage.getSource("file", inputSource.path, inputSource.originalSource, parentSource);

        const preprocessor = new PreProcessorExecutor(this._logger);

        try
        {
            const contents = await preprocessor.extract(inputSource);
            if (!contents) {
                this._manifestPackage.sourceError(source, `Could not extract manifest contents from ${inputSource.preprocessor}`);
                return [];
            } else {
                return this._parseContents(source, inputSource.path, contents);
            }
        }
        catch(reason : any)
        {
            this._logger.info("[_loadFile] ERROR: ", reason);
            this._manifestPackage.sourceError(source, `Failed to extract manifest from ${inputSource.preprocessor}. Reason: ${reason?.message ?? "Unknown"}`);
            return [];
        }
    }

    private async _loadFile(inputSource: InputSource, parentSource?: ManifestSource) : Promise<K8sManifest[]>
    {
        const path = inputSource.path;

        // const orignalSource = inputSource.originalSource
        const source = this._manifestPackage.getSource("file", path, inputSource.originalSource, parentSource);

        this._logger.info("[_loadFile] path: %s", path);

        try
        {
            const contents = await fs.promises.readFile(path, { encoding: 'utf8' });
            return this._parseContents(source, path, contents);
        }
        catch(reason : any)
        {
            this._logger.info("[_loadFile] ERROR: ", reason);
            this._manifestPackage.sourceError(source, 'Failed to load manifest. Reason: ' + (reason?.message ?? "Unknown"));
            return [];
        }
    }

    private async _loadUrl(inputSource: InputSource, parentSource?: ManifestSource) : Promise<K8sManifest[]>
    {
        const url = inputSource.path;
        const source = this._manifestPackage.getSource("web", url, inputSource.originalSource, parentSource);

        this._logger.info("[_loadUrl] url: %s", url);
        try
        {
            const { data } = await axios.get(url);
            const contents = data.toString();
            return this._parseContents(source, url, contents);
        }
        catch(reason : any)
        {
            // this._logger.error("_loadUrl] ERROR: ", reason);
            this._manifestPackage.sourceError(source, 'Failed to fetch manifest. Reason: ' + (reason?.message ?? "Unknown"));
            return [];
        }
    }

    private _parseContents(source: ManifestSource, path: string, contents: string) : K8sManifest[]
    {
        this._logger.info("[_parseContents] path: %s", path);
        
        const manifests: K8sManifest[] = [];

        const extension = Path.extname(path);
        if (extension === '.yaml' || extension === '.yml')
        {
            let configs : any[] | null = [];
            try
            {
                configs = this._parseYaml(contents);    
            }
            catch(reason: any)
            {
                this._manifestPackage.sourceError(source, reason.message ?? 'Error parsing YAML.');
            }

            if (configs)
            {
                this._logger.info("[_parseContents] Manifest Count: %s", configs.length);
                this._logger.silly("[_parseContents] Manifests: ", configs);
                for(const config of configs)
                {
                    const manifest = this._addManifest(source, config);
                    if (manifest) {
                        manifests.push(manifest);
                    }
                }
            }         
            else
            {
                this._logger.info("[_parseContents] No Manifests Found.");
            }
            
            
        }
        else if (extension === '.json')
        {
            let configs : any;
            try
            {
                configs = JSON.parse(contents);
            }
            catch(reason: any)
            {
                this._manifestPackage.sourceError(source, reason.message ?? 'Error parsing JSON');
            }
            if (configs)
            {
                const manifest = this._addManifest(source, configs);
                if (manifest) {
                    manifests.push(manifest);
                }
            }
        } else {
            this._manifestPackage.sourceError(source, 'Unknown extension. Should be one of: .yaml, .yml or .json');
        }

        if (source.success)
        {
            if (source.manifests.length === 0)
            {
                if (!this._options.ignoreNonK8s) {
                    this._manifestPackage.sourceError(source, 'Contains no manifests');
                }

            }
        }

        return manifests;
    }

    private _addManifest(source : ManifestSource, config: any) : K8sManifest | null
    {
        this._logger.silly("[_addManifest] file: %s, manifest:", source.id.path, config);
        if (!config) {
            return null;
        }

        const k8sObject = this._sanitizeManifest(config as K8sObject);

        const errors = this._checkK8sManifest(k8sObject);
        if (errors.length > 0)
        {
            if (!this._options.ignoreNonK8s) {
                this._manifestPackage.sourceErrors(source, errors);
            }
            return null;
        }

        return this._manifestPackage.addManifest(source, k8sObject);
    }

    private _checkK8sManifest(k8sObject: K8sObject)
    {
        const errors: string[] = [];
        if (!k8sObject.apiVersion) {
            errors.push('Not a Kubernetes manifest. apiVersion is missing.');
        }
        if (!k8sObject.kind) {
            errors.push('Not a Kubernetes manifest. kind is missing.');
        }
        return errors;
    }

    private _parseYaml(contents: string) : any[] | null
    {
        // this._logger.info("[parseYaml] >>>>>>>>>>>>>>>. STR: ", contents);

        const result = YAML.parseAllDocuments(contents, {
        });

        if (!result) {
            return [];
        }
        
        const jsons = result.map(x => x.toJS({ })); // emptySourceAsObject: false 
        // for(const json of jsons)
        // {
        //     this._logger.info("[parseYaml] *************************** DATA: ", json);
        // }
        return jsons;
    }

    private _sanitizeManifest(obj: K8sObject) : K8sObject
    {
        return sanitizeYaml(obj);
    }

}
