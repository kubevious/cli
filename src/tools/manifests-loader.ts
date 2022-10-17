import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import glob from 'glob';
import * as fs from 'fs';
import * as Path from 'path';
import { K8sObject } from '../types/k8s';
import * as yaml from 'js-yaml'

import { ManifestFile, ManifestPackage } from './manifest-package';

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

    load(fileOrPattern: string)
    {
        this._logger.info("[load] FileOrPattern: %s", fileOrPattern);

        const pattern = this._makeSearchPattern(fileOrPattern);
        this._logger.info("[load] pattern: %s", pattern);

        if (!pattern)
        {
            return;
        }

        const files = glob.sync(pattern, {  });
        this._logger.info("FILES: ", files);

        for(const file of files)
        {
            this._loadFile(file);
        }
    }

    private _loadFile(path: string)
    {
        this._logger.info("[_loadFile] path: %s", path);

        const file = this._package.getFile(path);

        const extension = Path.extname(path);
        if (extension === '.yaml' || extension === '.yml')
        {
            const contents = fs.readFileSync(path, { encoding: 'utf8' });
            let manifests : any[] = [];
            try
            {
                manifests = yaml.loadAll(contents);    
            }
            catch(reason: any)
            {
                this._package.fileError(file, reason.message ?? 'Error parsing YAML.');
            }

            if (manifests)
            {
                this._logger.info("[_loadFile]     count: %s", manifests.length);
                for(const manifest of manifests)
                {
                    this._addManifest(file, manifest);
                }
            }            
        }
        else if (extension === '.json')
        {
            const contents = fs.readFileSync(path, { encoding: 'utf8' });
            let manifest : any;
            try
            {
                manifest = JSON.parse(contents);
            }
            catch(reason: any)
            {
                this._package.fileError(file, reason.message ?? 'Error parsing JSON');
            }
            if (manifest)
            {
                this._addManifest(file, manifest);
            }
        }

        if (file.isValid)
        {
            if (file.contents.length === 0)
            {
                this._package.fileError(file, 'Contains no manifests');
            }
        }
    }

    private _addManifest(file : ManifestFile, manifest: any)
    {
        this._logger.silly("[_addManifest] file: %s, manifest:", file.path, manifest);

        const k8sManifest = manifest as K8sObject;
        const errors = this._checkK8sManifest(k8sManifest);
        if (errors.length > 0)
        {
            this._package.fileErrors(file, errors);
            return;
        }

        this._package.addManifest(file, k8sManifest);
    }

    private _checkK8sManifest(k8sManifest: K8sObject)
    {
        const errors: string[] = [];
        if (!k8sManifest.apiVersion) {
            errors.push('Not a Kubernetes manifest. apiVersion is missing.');
        }
        if (!k8sManifest.kind) {
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
