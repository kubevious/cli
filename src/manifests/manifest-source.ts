import _ from 'the-lodash';
import { ErrorStatus, ManifestSourceId, ManifestSourceType } from "../types/manifest";
import { K8sManifest } from './k8s-manifest';
import { OriginalSource } from './original-source';


export class ManifestSource implements Required<ErrorStatus>
{
    private _id: ManifestSourceId;
    private _key: string;
    private _manifests: K8sManifest[] = [];

    private _parentSource: ManifestSource | null = null;
    private _childSources: Record<string, ManifestSource> = {}

    public success = true;
    public errors: string[] = [];
    public warnings: string[] = [];
    public originalSource : OriginalSource | null = null;

    constructor(kind: ManifestSourceType, path: string, originalSource: OriginalSource | null)
    {
        this._id = {
            kind,
            path
        };
        this._key = makeSourceKey(kind, path);
        this.originalSource = originalSource;
    }

    get key() {
        return this._id;
    }

    get id() {
        return this._id;
    }

    // get source() {
    //     return this._id;
    // }

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
            source = new ManifestSource(kind, path, originalSource);
            this._childSources[sourceKey] = source;
            source._parentSource = this;
        }
        return source;
    }
}

export function makeSourceKey(kind: ManifestSourceType, path: string)
{
    return _.stableStringify({kind, path});
}
