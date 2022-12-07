import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sObject } from '../types/k8s';
import { ManifestSourceType } from '../types/manifest';
import { K8sManifest } from './k8s-manifest';
import { ManifestSource } from "./manifest-source";

export class ManifestPackage
{
    private _logger: ILogger;
    private _rootSource : ManifestSource = new ManifestSource('root', 'root');
    private _manifests: K8sManifest[] = [];
    private _namespaces : string[] = [];

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('ManifetPackage');
    }

    get sources() {
        return this._rootSource.childSources;
    }

    get manifests() {
        return this._manifests;
    }

    get namespaces() {
        return this._namespaces;
    }

    getSource(kind: ManifestSourceType, path: string) : ManifestSource
    {
        return this._rootSource.getSource(kind, path);
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

    addManifest(source: ManifestSource, k8sObject: K8sObject) : K8sManifest
    {
        const k8sManifest = new K8sManifest(k8sObject, source)

        source.manifests.push(k8sManifest);
        this._manifests.push(k8sManifest);

        return k8sManifest;
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

    public debugOutput()
    {
        this._logger.info('[ManifestPackage] BEGIN SOURCES');

        this._debugOutputSource(this._rootSource, 0);
        // for(const originalSource of this.originalSources)
        // {
        //     this._logger.info('[OrigSource] => %s :: %s', originalSource.kind, originalSource.path);

        //     for (const source of originalSource.innerSources)
        //     {
        //         if (source.isSkipped) {
        //             this._logger.info('              > %s [SKIPPED]', source.key);
        //         } else {
        //             this._logger.info('              > %s', source.key);
        //         }
        //     }
        // }

        this._logger.info('[ManifestPackage] END');
    }

    private _debugOutputSource(source: ManifestSource, indent: number)
    {
        this._logger.info("[ManifestPackage] %s| + [%s] %s", 
            " ".repeat(indent * 2),
            source.id.kind.toUpperCase(),
            source.id.path)

        for(const child of source.childSources)
        {
            this._debugOutputSource(child, indent + 1);
        }
    }
}
