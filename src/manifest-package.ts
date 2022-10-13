import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sObject } from './k8s-types';

export class ManifestPackage
{
    private _logger: ILogger;
    private _files: { [path: string] : ManifestFile } = {}
    private _objects: K8sObjectInfo[] = [];

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('ManifetPackage');
    }

    get files() {
        return _.values(this._files);
    }

    get manifests() {
        return this._objects;
    }

    getFile(path: string)
    {
        let file = this._files[path];
        if (!file) {
            file = {
                path: path,
                isValid: true,
                errors: [],
                contents: []
            }
            this._files[path] = file;
        }
        return file;
    }

    fileError(file: ManifestFile, error: string)
    {
        file.errors.push(error);
        file.isValid = false;
    }

    fileErrors(file: ManifestFile, errors: string[])
    {
        for(const error of errors)
        {
            this.fileError(file, error);
        }
    }

    addManifest(file: ManifestFile, k8sManifest: K8sObject)
    {
        const objectInfo : K8sObjectInfo = {
            apiVersion: k8sManifest.apiVersion,
            kind: k8sManifest.kind,
            namespace: k8sManifest.metadata?.namespace,
            name: k8sManifest.metadata?.name,

            file: file,
            config: k8sManifest,
        }

        file.contents.push(objectInfo);
        this._objects.push(objectInfo);
    }
}

export interface ManifestFile
{
    path: string;
    isValid: boolean;
    errors: string[];
    contents: K8sObjectInfo[];
}

export interface K8sObjectInfo
{
    apiVersion: string;
    kind: string;
    namespace?: string;
    name?: string;

    file: ManifestFile;
    config: K8sObject;
}