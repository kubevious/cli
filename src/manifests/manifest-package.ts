import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sObject } from '../types/k8s';
import { ManifestSourceId, ManifestSourceType } from '../types/manifest';
import { K8sManifest, ManifestSource } from './k8s-manifest';

export class ManifestPackage
{
    private _logger: ILogger;
    private _sources: { [key: string] : ManifestSource } = {}
    private _manifests: K8sManifest[] = [];
    private _namespaces : string[] = [];

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

    get namespaces() {
        return this._namespaces;
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
                warnings: [],
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

    manifestError(manifest: K8sManifest, msg: string)
    {
        manifest.errors.push(msg);
        manifest.success = false;
    }

    manifestErrors(manifest: K8sManifest, msgs: string[])
    {
        for(const msg of msgs)
        {
            this.manifestError(manifest, msg);
        }
    }

    manifestWarning(manifest: K8sManifest, msg: string)
    {
        manifest.warnings.push(msg);
        // manifest.success = false;
    }

    manifestWarnings(manifest: K8sManifest, msgs?: string[])
    {
        if (msgs) {
            for(const msg of msgs)
            {
                this.manifestWarning(manifest, msg);
            }
        }
    }

    addManifest(source: ManifestSource, k8sObject: K8sObject)
    {
        const k8sManifest = new K8sManifest(k8sObject, source)

        source.contents.push(k8sManifest);
        this._manifests.push(k8sManifest);
    }

    public produceNamespaces()
    {
        const namespaces : Record<string, boolean> = {};
        for(const x of this.manifests)
        {
            if (x.id.namespace) {
                namespaces[x.id.namespace] = true;
            }
        }
        this._namespaces = _.keys(namespaces);
    }
}
