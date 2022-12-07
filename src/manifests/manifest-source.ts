import _ from 'the-lodash';
import { ErrorStatus, ManifestSourceId, ManifestSourceType } from "../types/manifest";
import { K8sManifest } from './k8s-manifest';


export class ManifestSource implements Required<ErrorStatus>
{
    private _id: ManifestSourceId;
    private _key: string;
    private _manifests: K8sManifest[] = [];
    private _childSources: Record<string, ManifestSource> = {}

    public success = true;
    public errors: string[] = [];
    public warnings: string[] = [];

    constructor(kind: ManifestSourceType, path: string)
    {
        this._id = {
            kind,
            path
        };
        this._key = makeSourceKey(kind, path);
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

    get childSources() {
        return _.values(this._childSources);
    }

    getSource(kind: ManifestSourceType, path: string) : ManifestSource
    {
        const sourceKey = makeSourceKey(kind, path);

        let source = this._childSources[sourceKey];
        if (!source) {
            source = new ManifestSource(kind, path);
            this._childSources[sourceKey] = source;
        }
        return source;
    }
}

export function makeSourceKey(kind: ManifestSourceType, path: string)
{
    return _.stableStringify({kind, path});
}
