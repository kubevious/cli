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
import { InputSourceExtractor } from '../input/input-source-extractor';
import { InputSource, InputSourceKind } from '../input/input-source';
import { PreProcessorExecutor } from '../preprocessors/executor';
import { ManifestSourceType } from '../types/manifest';

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
                source.reportError(`No input was found.`);
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
                    source.reportError(reason.message ?? 'Error parsing YAML.');
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
                    this.addManifest(source, manifest);
                }
            }
            else
            {
                source.reportError('Failed to parse manifests from stream.');
            }
        }
        catch(reason: any)
        {
            source.reportError(`Failed to fetch manifest. Reason: ${reason.message ?? 'unknown'}`);
        }
    }

    public async loadSingle(inputSource: InputSource, parentSource?: ManifestSource) : Promise<K8sManifest[]>
    {
        this._logger.info("[loadSingle] %s :: %s", inputSource.kind, inputSource.path);

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
        const kind : ManifestSourceType = inputSource.kind;
        const source = this._manifestPackage.getSource(kind, inputSource.path, inputSource.originalSource, parentSource);

        const preprocessor = new PreProcessorExecutor(this._logger, this);

        try
        {
            await preprocessor.execute(inputSource, source);

            return source.manifests; // TODO: Include Hierarchy manifests too.
        }
        catch(reason : any)
        {
            this._logger.info("[_loadFile] ERROR: ", reason);
            source.reportError(`Failed to execute preprocessor: ${inputSource.preprocessor}. Reason: ${reason?.message ?? "Unknown"}`);
            return [];
        }
    }

    private async _loadFile(inputSource: InputSource, parentSource?: ManifestSource) : Promise<K8sManifest[]>
    {
        const path = inputSource.path;

        const source = this._manifestPackage.getSource("file", path, inputSource.originalSource, parentSource);

        this._logger.info("[_loadFile] path: %s", path);

        try
        {
            const contents = await this.rawReadFile(path);
            return this.parseContents(source, path, contents);
        }
        catch(reason : any)
        {
            this._logger.info("[_loadFile] ERROR: ", reason);
            source.reportError('Failed to load manifest. Reason: ' + (reason?.message ?? "Unknown"));
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
            return this.parseContents(source, url, contents);
        }
        catch(reason : any)
        {
            // this._logger.error("_loadUrl] ERROR: ", reason);
            source.reportError('Failed to fetch manifest. Reason: ' + (reason?.message ?? "Unknown"));
            return [];
        }
    }

    public parseContents(source: ManifestSource, path: string, contents: string) : K8sManifest[]
    {
        this._logger.info("[parseContents] path: %s", path);
        
        const manifests: K8sManifest[] = [];

        const extension = Path.extname(path);
        this._logger.info("[parseContents] extension: %s", extension);

        if (extension === '.yaml' || extension === '.yml')
        {
            let configs : any[] | null = [];
            try
            {
                configs = this._parseYaml(contents);
            }
            catch(reason: any)
            {
                source.reportError(reason.message ?? 'Error parsing YAML.');
            }

            if (configs)
            {
                this._logger.info("[parseContents] Manifest Count: %s", configs.length);
                this._logger.silly("[parseContents] Manifests: ", configs);
                for(const config of configs)
                {
                    const manifest = this.addManifest(source, config);
                    if (manifest) {
                        manifests.push(manifest);
                    }
                }
            }         
            else
            {
                this._logger.info("[parseContents] No Manifests Found.");
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
                source.reportError(reason.message ?? 'Error parsing JSON');
            }
            if (configs)
            {
                const manifest = this.addManifest(source, configs);
                if (manifest) {
                    manifests.push(manifest);
                }
            }
        } else {
            source.reportError('Unknown extension. Should be one of: .yaml, .yml or .json');
        }

        if (source.success)
        {
            if (source.manifests.length === 0)
            {
                if (!this._options.ignoreNonK8s) {
                    // TODO: Move this to post parse validation logic
                    source.reportError('Contains no manifests');
                }

            }
        }

        return manifests;
    }

    public addManifest(source : ManifestSource, config: any) : K8sManifest | null
    {
        this._logger.info("[addManifest] source path: %s", source.id.path);
        // this._logger.silly("[addManifest] source path: %s, manifest:", source.id.path, config);
        if (!config) {
            return null;
        }

        const k8sObject = this._sanitizeManifest(config as K8sObject);

        const errors = this._checkK8sManifest(k8sObject);
        if (errors.length > 0)
        {
            if (!this._options.ignoreNonK8s) {
                source.reportErrors(errors);
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

    public parseYamlRaw(contents: string) : YAML.Document.Parsed<YAML.ParsedNode>[]
    {
        const result = YAML.parseAllDocuments(contents, {
        }); 

        if (!result) {
            return [];
        }

        return result;
    }

    public rawYamlToObj(rawYaml: YAML.Document.Parsed<YAML.ParsedNode>)
    {
        return rawYaml.toJS({});
    }

    public async rawReadFile(path: string)
    {
        try
        {
            const contents = await fs.promises.readFile(path, { encoding: 'utf8' });
            return contents;
        }
        catch(reason : any)
        {
            this._logger.info("[rawReadFile] ERROR: ", reason);
            throw reason;
        }
    }

    private _parseYaml(contents: string) : any[]
    {
        const result = this.parseYamlRaw(contents);
        const jsons = result.map(x => this.rawYamlToObj(x));
        return jsons;
    }

    private _sanitizeManifest(obj: K8sObject) : K8sObject
    {
        return sanitizeYaml(obj);
    }

}
