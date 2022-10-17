import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sObject, K8sObjectId, makeId } from '../types/k8s';
import { ErrorStatus, ManifestSourceId, ManifestSourceType } from '../types/manifest';

export class ManifestPackage
{
    private _logger: ILogger;
    private _sources: { [key: string] : ManifestSource } = {}
    private _manifests: K8sManifest[] = [];

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('ManifetPackage');
    }

    get sources() {
        return _.values(this._sources);
    }

    get manifests() {
        return this._manifests;
    }

    getSource(kind: ManifestSourceType, path: string) : ManifestSource
    {
        const sourceId : ManifestSourceId = {
            kind: kind,
            path: path
        };
        const sourceKey = _.stableStringify(sourceId);

        let source = this._sources[sourceKey];
        if (!source) {
            source = {
                source: sourceId,
                success: true,
                errors: [],
                contents: []
            }
            this._sources[sourceKey] = source;
        }
        return source;
    }

    sourceError(source: ManifestSource, error: string)
    {
        source.errors.push(error);
        source.success = false;
    }

    sourceErrors(source: ManifestSource, errors: string[])
    {
        for(const error of errors)
        {
            this.sourceError(source, error);
        }
    }

    manifestError(manifest: K8sManifest, error: string)
    {
        manifest.errors.push(error);
        manifest.success = false;
    }

    manifestErrors(manifest: K8sManifest, errors: string[])
    {
        for(const error of errors)
        {
            this.manifestError(manifest, error);
        }
    }

    addManifest(source: ManifestSource, k8sManifest: K8sObject)
    {
        const objectInfo : K8sManifest = {

            id: makeId(k8sManifest),

            success: true,
            errors: [],

            source: source,
            config: k8sManifest,
        }

        source.contents.push(objectInfo);
        this._manifests.push(objectInfo);
    }
}

export interface ManifestSource extends Required<ErrorStatus>
{
    source: ManifestSourceId;

    contents: K8sManifest[];
}


export interface K8sManifest extends Required<ErrorStatus>
{
    id: K8sObjectId;

    source: ManifestSource;
    config: K8sObject;
}