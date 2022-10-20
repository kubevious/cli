import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise } from 'the-promise';
import axios from 'axios';
import glob from 'glob';
import * as fs from 'fs';
import * as Path from 'path';
import { K8sObject } from '../types/k8s';
import * as yaml from 'js-yaml'

import { ManifestSource, ManifestPackage } from './manifest-package';
import { readFromInputStream } from '../utils/stream';
import { spinOperation } from '../utils/screen';

export class ManifetsLoader
{
    private _logger: ILogger;
    private _package : ManifestPackage;

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('ManifetsLoader');
        this._package = new ManifestPackage(logger);
    }

    get package() {
        return this._package;
    }

    load(fileOrPatternOrUrl: string) : Promise<ManifestPackage>
    {
        this._logger.info("[load] fileOrPatternOrUrl: %s", fileOrPatternOrUrl);

        const spinner = spinOperation('Loading manifests...');

        return Promise.resolve()
            .then(() => {

                if (!fileOrPatternOrUrl) {
                    return this._loadFromStream();
                }
                else if (_.startsWith(fileOrPatternOrUrl, 'http://') || _.startsWith(fileOrPatternOrUrl, 'https://'))
                {
                    return this._loadUrl(fileOrPatternOrUrl);
                }
                else
                {
                    return this._loadFileOrPattern(fileOrPatternOrUrl);
                }
               
            })
            .then(() => {
                spinner.complete('Manifests loaded.');
            })
            .then(() => this.package)
            ;
    }

    private _loadFileOrPattern(fileOrPattern: string) : Promise<void>
    {
        const pattern = this._makeSearchPattern(fileOrPattern);
        this._logger.info("[_loadFileOrPattern] pattern: %s", pattern);
        if (!pattern) {
            return Promise.resolve();
        }

        return Promise.construct<string[]>((resolve, reject) => {
            return glob(pattern, (err, matches) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(matches);
                }
            })
        })
        .then(files => {
            return Promise.serial(files, file => this._loadFile(file));
        })
        .then(() => {})
    }

    private _loadFile(path: string)
    {
        const source = this._package.getSource("file", path);

        this._logger.info("[_loadFile] path: %s", path);
        const contents = fs.readFileSync(path, { encoding: 'utf8' });
        this._parseSource(source, path, contents);
    }

    private _loadUrl(url: string)
    {
        const source = this._package.getSource("web", url);

        this._logger.info("[_loadUrl] url: %s", url);
        return axios.get(url)
            .then(({ data }) => {
                const contents = data.toString();
                this._parseSource(source, url, contents);
            })
            .catch(reason => {
                this._package.sourceError(source, 'Failed to fetch manifest. Reason: ' + reason.message);
            })
    }

    private _loadFromStream()
    {
        this._logger.info("[_loadFromStream] ");
        const source = this._package.getSource("stream", 'stream');

        return readFromInputStream()
            .then((contents) => {

                let manifests : any[] | null = null;
            
                if (!manifests) {
                    try
                    {
                        manifests = yaml.loadAll(contents);    
                    }
                    catch(reason: any)
                    {
                        this._package.sourceError(source, reason.message ?? 'Error parsing YAML.');
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
                    this._package.sourceError(source, 'Failed to parse manifests from stream.');
                }

            })
            .catch(reason => {
                this._package.sourceError(source, 'Failed to fetch manifest. Reason: ' + reason.message);
            })
    }

    private _parseSource(source: ManifestSource, path: string, contents: string)
    {
        this._logger.info("[_parseSource] path: %s", path);

        const extension = Path.extname(path);
        if (extension === '.yaml' || extension === '.yml')
        {
            let manifests : any[] = [];
            try
            {
                manifests = yaml.loadAll(contents);    
            }
            catch(reason: any)
            {
                this._package.sourceError(source, reason.message ?? 'Error parsing YAML.');
            }

            if (manifests)
            {
                this._logger.info("[_loadFile]     count: %s", manifests.length);
                for(const manifest of manifests)
                {
                    this._addManifest(source, manifest);
                }
            }            
        }
        else if (extension === '.json')
        {
            let manifest : any;
            try
            {
                manifest = JSON.parse(contents);
            }
            catch(reason: any)
            {
                this._package.sourceError(source, reason.message ?? 'Error parsing JSON');
            }
            if (manifest)
            {
                this._addManifest(source, manifest);
            }
        } else {
            this._package.sourceError(source, 'Unknown extension. Should be one of: .yaml, .yml or .json');
        }

        if (source.success)
        {
            if (source.contents.length === 0)
            {
                this._package.sourceError(source, 'Contains no manifests');
            }
        }
    }

    private _addManifest(source : ManifestSource, config: any)
    {
        this._logger.silly("[_addManifest] file: %s, manifest:", source.source.path, config);
        if (!config) {
            return;
        }

        const k8sObject = config as K8sObject;
        const errors = this._checkK8sManifest(k8sObject);
        if (errors.length > 0)
        {
            this._package.sourceErrors(source, errors);
            return;
        }

        this._package.addManifest(source, k8sObject);
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
