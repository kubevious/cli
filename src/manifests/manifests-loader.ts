import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise } from 'the-promise';
import axios from 'axios';
import glob from 'glob';
import * as fs from 'fs';
import * as Path from 'path';
import { K8sObject } from '../types/k8s';
import YAML from 'yaml';

import { ManifestPackage } from './manifest-package';
import { readFromInputStream } from '../utils/stream';
import { spinOperation } from '../screen/spinner';
import { K8sManifest, ManifestSource } from './k8s-manifest';
import { isWeb, joinPath } from '../utils/path';

export interface ManifetsLoaderOptions
{
    ignoreNonK8s: boolean;
}

export class ManifetsLoader
{
    private _logger: ILogger;
    private _manifestPackage: ManifestPackage;
    private _options: ManifetsLoaderOptions;

    constructor(logger: ILogger, manifestPackage : ManifestPackage, options? : Partial<ManifetsLoaderOptions>)
    {
        this._logger = logger.sublogger('ManifetsLoader');
        this._manifestPackage = manifestPackage;

        options = options ?? {};
        this._options = {
            ignoreNonK8s: options.ignoreNonK8s ?? false
        };

        this._logger.info("setup. options: ", this._options);
    }

    get manifestPackage() {
        return this._manifestPackage;
    }

    public load(fileOrPatternOrUrls: string[]) : Promise<void>
    {
        this._logger.info("[load] fileOrPatternOrUrl: ", fileOrPatternOrUrls);

        if (fileOrPatternOrUrls.length === 0)
        {
            return Promise.resolve();
        }

        const spinner = spinOperation('Loading manifests...');

        return Promise.resolve()
            .then(() => {
                return this._loadMany(fileOrPatternOrUrls);
            })
            .then(() => {
                spinner.complete('Manifests loaded.');
            })
            ;
    }

    public loadFromStream()
    {
        this._logger.info("[_loadFromStream] ");
        const source = this._manifestPackage.getSource("stream", 'stream');

        return readFromInputStream()
            .then((contents) => {

                let manifests : any[] | null = null;
            
                if (!manifests) {
                    try
                    {
                        manifests = parseYaml(contents);
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

            })
            .catch(reason => {
                this._manifestPackage.sourceError(source, 'Failed to fetch manifest. Reason: ' + reason.message);
            })
    }

    private _loadMany(fileOrPatternOrUrls: string[]) : Promise<void>
    {
        return Promise.serial(fileOrPatternOrUrls, x => this.loadSingle(x))
            .then(() => {});
    }

    public loadSingle(fileOrPatternOrUrl: string, parentSource?: ManifestSource) : Promise<K8sManifest[]>
    {
        let finalPath = fileOrPatternOrUrl;
        if (parentSource &&
            (parentSource.source.kind === "file" || parentSource.source.kind === "web" ))
        {
            finalPath = joinPath(parentSource.source.path, finalPath);
        }

        if (isWeb(finalPath))
        {
            return this._loadUrl(finalPath);
        }
        else
        {
            return this._loadFileOrPattern(finalPath);
        }
    }

    private _loadFileOrPattern(fileOrPattern: string) : Promise<K8sManifest[]>
    {
        const pattern = this._makeSearchPattern(fileOrPattern);
        this._logger.info("[_loadFileOrPattern] pattern: %s", pattern);
        if (!pattern) {
            return Promise.resolve([]);
        }

        return Promise.construct<string[]>((resolve, reject) => {
            return glob(pattern,
                 {
                    nodir: true
                 },
                 (err, matches) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(matches);
                    }
                })
        })
        .then(files => {
            this._logger.info("[_loadFileOrPattern] files: ", files);
            return Promise.serial(files, file => this._loadFile(file));
        })
        .then(results => _.flatten(results))
    }

    private _loadFile(path: string)
    {
        const source = this._manifestPackage.getSource("file", path);

        this._logger.info("[_loadFile] path: %s", path);
        const contents = fs.readFileSync(path, { encoding: 'utf8' });
        return this._parseContents(source, path, contents);
    }

    private _loadUrl(url: string) : Promise<K8sManifest[]>
    {
        const source = this._manifestPackage.getSource("web", url);

        this._logger.info("[_loadUrl] url: %s", url);
        return Promise.resolve()
            .then(() => axios.get(url))
            .then(({ data }) => {
                const contents = data.toString();
                return this._parseContents(source, url, contents);
            })
            .catch(reason => {
                this._manifestPackage.sourceError(source, 'Failed to fetch manifest. Reason: ' + reason.message);
                return [];
            })
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
                configs = parseYaml(contents);    
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
            if (source.contents.length === 0)
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
        this._logger.silly("[_addManifest] file: %s, manifest:", source.source.path, config);
        if (!config) {
            return null;
        }

        const k8sObject = config as K8sObject;
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

    private _makeSearchPattern(fileOrPattern: string) : string | null
    {
        if (fs.existsSync(fileOrPattern))
        {
            const stats = fs.statSync(fileOrPattern);
            if (stats.isDirectory())
            {
                return Path.join(fileOrPattern, '**/*[.yaml|.yml]')
            }

            if (stats.isFile())
            {
                return fileOrPattern;
            }
        }
        else
        {
            return fileOrPattern;
        }

        return null;
    }

}

function parseYaml(contents: string) : any[] | null
{
    // console.log(">>>>>>>>>>>>>>>")
    // console.log(contents);
    // console.log("<<<<<<<<>>>>>>>>*")

    const result = YAML.parseAllDocuments(contents, {
    });

    if (!result) {
        return [];
    }
    
    const jsons = result.map(x => x.toJS({ })); // emptySourceAsObject: false 
    // console.log("***************************")
    // console.log(jsons);
    // console.log("***************************")
    return jsons;
}