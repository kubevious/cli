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
        const k8sManifest : K8sManifest = {

            id: makeId(k8sObject),

            isLinted: false,
            rules: {},
            
            success: true,
            errors: [],
            warnings: [],

            source: source,
            config: k8sObject,
        }


        source.contents.push(k8sManifest);
        this._manifests.push(k8sManifest);
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

    isLinted: boolean;
    rules: K8sManifestRuleResult;

    errorsWithRule?: boolean;

    source: ManifestSource;
    config: K8sObject;
}

export interface K8sManifestRuleResult
{
    processed?: boolean;
    errors?: boolean;
    warnings?: boolean;
}