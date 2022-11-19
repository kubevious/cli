import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sObject } from '../types/k8s';
import { K8sTargetFilter } from '../rules-engine/query-spec/k8s-target-query';
import { RegistryQueryExecutor } from '../rules-engine/query-executor';
import { K8sClusterConnector } from '../k8s-connector/k8s-cluster-connector';
import { KubernetesClient, KubernetesObject } from 'k8s-super-client';
import { parseApiVersion } from '../utils/k8s';
import { ClientSideFiltering } from './client-side-filtering';
import { K8sManifest, ManifestSource } from '../manifests/k8s-manifest';

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
        this._logger.info("[query] ", query);

        let apiName : string | null | undefined = undefined;
        let version : string | undefined = undefined;

        if (query.isApiVersion) {
            const apiVersion = parseApiVersion(query.apiVersion!);

            apiName = apiVersion?.group || null;
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

        this._logger.info("[query] apiName: %s", apiName);
        this._logger.info("[query] version: %s", version);

        if (!query.kind) {
            this._logger.info("[query] No Kind");
            return [];
        }

        const resourceClient = this._client.client(query.kind, apiName, version);
        if (!resourceClient) {
            this._logger.info("[query] Unknown Resource");
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

        this._logger.info("[query] result count: %s", results.length);


        const manifests = results.map(x => this._makeManifest(x));

        const filtering = new ClientSideFiltering(manifests);
        filtering.applyLabelFilter(query.labelFilters);
        return filtering.items;
    }

    private _makeManifest(config: KubernetesObject) : K8sManifest
    {
        const k8sObject = config as K8sObject;
        const k8sManifest = new K8sManifest(k8sObject, this._source);
        return k8sManifest;
    }

}