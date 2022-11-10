import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sManifest, ManifestSource } from '../manifests/manifest-package';
import { K8sObject, makeId } from '../types/k8s';
import { K8sTargetFilter } from '../rules-engine/target/k8s-target-builder';
import { RegistryQueryExecutor } from '../rules-engine/query-executor';
import { K8sClusterConnector } from '../k8s-connector/k8s-cluster-connector';
import { KubernetesClient, KubernetesObject } from 'k8s-super-client';
import { parseApiVersion } from '../utils/k8s';
import { ClientSideFiltering } from './client-side-filtering';

export class RemoteK8sRegistry implements RegistryQueryExecutor
{
    private _logger: ILogger;
    private _k8sConnector: K8sClusterConnector;
    private _client: KubernetesClient;
    private _source: ManifestSource = {
        source: {
            kind: "k8s",
            path: "live"
        },
        contents: [],
        success: true,
        errors: [],
        warnings: [],
    };

    
    constructor(logger: ILogger, k8sConnector: K8sClusterConnector)
    {
        this._logger = logger.sublogger('RemoteK8sRegistry');
        this._k8sConnector = k8sConnector;
        this._client = k8sConnector.client!;
    }

    query(query: K8sTargetFilter) : K8sManifest[]
    {
        let apiName : string | null | undefined = undefined;
        let version : string | undefined = undefined;

        if (query.isApiVersion) {
            const apiVersion = parseApiVersion(query.apiVersion!);

            apiName = apiVersion?.group;
            version = apiVersion?.version;
        } else {
            if (query.apiOrNone) {
                apiName = query.apiOrNone;
            } else {
                apiName = null;
            }

            if (query.version) {
                version = query.version;
            }
        }

        if (!query.kind) {
            return [];
        }

        const resourceClient = this._client.client(query.kind, apiName, version);
        if (!resourceClient) {
            return [];
        }

        let results : KubernetesObject[] = [];

        if (query.nameFilters && query.nameFilters.length > 0)
        {
            const namespace = query.namespace ?? null;
            const nameDict = _.makeBoolDict(query.nameFilters);

            for(const name of _.keys(nameDict))
            {
                const item = resourceClient.querySync(namespace, name);
                if (item) {
                    results.push(item);
                }
            }
            results = results.filter(x => x.id.name && nameDict[x.id.name]);
        }
        else
        {
            // TODO: Try using label filter as an optimization:.
            results = resourceClient.queryAllSync(query.namespace);
        }

        const manifests = results.map(x => this._makeManifest(x));

        const filtering = new ClientSideFiltering(manifests);
        filtering.applyLabelFilter(query.labelFilters);
        return filtering.items;
    }

    private _makeManifest(config: KubernetesObject) : K8sManifest
    {
        const k8sObject = config as K8sObject;
        const k8sManifest : K8sManifest = {

            id: makeId(k8sObject),

            isLinted: false,
            rules: {},
            
            success: true,
            errors: [],
            warnings: [],

            source: this._source,
            config: k8sObject,
        }
        return k8sManifest;
    }

}