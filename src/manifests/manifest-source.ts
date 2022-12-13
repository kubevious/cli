import _ from 'the-lodash';
import { ManifestSourceId, ManifestSourceType } from "../types/manifest";
import { resolvePath } from '../utils/path';
import { K8sManifest } from './k8s-manifest';
import { OriginalSource } from '../input/original-source';
import { rootLogger } from '../logger'
import { BaseObject } from '../types/base-object';
import { makeObjectSeverity, makeObjectSeverityFromChildren, ManifestPackageCounters, SourceInfoResult, SourceResult } from '../types/result';

const logger = rootLogger.sublogger("ManifestSource");

export class ManifestSource extends BaseObject 
{
    private _id: ManifestSourceId;
    private _idKey: string;
    private _manifests: K8sManifest[] = [];

    private _parentSource: ManifestSource | null = null;
    private _childSources: Record<string, ManifestSource> = {}

    public originalSource : OriginalSource | null = null;

    constructor(kind: ManifestSourceType, path: string, originalSource: OriginalSource | null)
    {
        super();

        this._id = {
            kind,
            path
        };
        this._idKey = makeSourceKey(kind, path);
        this.originalSource = originalSource;
    }

    get idKey() {
        return this._idKey;
    }

    get id() {
        return this._id;
    }

    get manifests() {
        return this._manifests;
    }

    get parentSource() {
        return this._parentSource;
    }

    get childSources() {
        return _.values(this._childSources);
    }

    getSource(kind: ManifestSourceType, path: string, originalSource: OriginalSource | null) : ManifestSource
    {
        const sourceKey = makeSourceKey(kind, path);

        let source = this._childSources[sourceKey];
        if (!source) {
            let childPath = path;
            if (this.id.path.length > 0) {
                childPath = resolvePath(path, this.id.path);
            } 
            source = new ManifestSource(kind, childPath, originalSource);
            this._childSources[sourceKey] = source;
            source._parentSource = this;
        }
        return source;
    }

    addManifest(k8sManifest: K8sManifest)
    {
        this._manifests.push(k8sManifest);
    }

    extractInfoResult() : SourceInfoResult
    {
        const result : SourceInfoResult = {
            kind: this.id.kind,
            path: this.id.path,
            ...this.extractBaseResult()
        }
        return result;
    }

    exportResult() : SourceResult
    {
        const result : SourceResult = {
            ...this.extractInfoResult(),
        }

        if (this.childSources.length > 0)
        {
            result.children = this.childSources.map(x => x.exportResult());
            result.severity = makeObjectSeverityFromChildren(result.severity, result.children);
        }

        if (this.manifests.length > 0)
        {
            result.manifests = this.manifests.map(x => x.exportInfoResult());
        }
        
        return result;
    }

    protected yieldChildren() : BaseObject[]
    {
        const list : BaseObject[][] = [ this.childSources, this.manifests ];
        return _.flatten(list);
    }
}

export function makeSourceKey(kind: ManifestSourceType, path: string)
{
    return _.stableStringify({kind, path});
}
    
