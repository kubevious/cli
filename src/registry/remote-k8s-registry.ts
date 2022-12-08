import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sObject } from '../types/k8s';
import { RegistryQueryExecutor, RegistryQueryOptions } from '../rules-engine/query-executor';
import { K8sClusterConnector } from '../k8s-connector/k8s-cluster-connector';
import { KubernetesClient, KubernetesObject } from 'k8s-super-client';
import { ClientSideFiltering } from './client-side-filtering';
import { K8sManifest } from '../manifests/k8s-manifest';
import { ManifestPackage } from '../manifests/manifest-package';

export class RemoteK8sRegistry implements RegistryQueryExecutor
{
    private _logger: ILogger;
    private _k8sConnector: K8sClusterConnector;
    private _client: KubernetesClient;
    private _manifestPackage: ManifestPackage;
   
    constructor(logger: ILogger, k8sConnector: K8sClusterConnector, manifestPackage: ManifestPackage)
    {
        this._logger = logger.sublogger('RemoteK8sRegistry');
        this._k8sConnector = k8sConnector;
        this._client = k8sConnector.client!;
        this._manifestPackage = manifestPackage;
    }

    query(query: RegistryQueryOptions) : K8sManifest[]
    {
        this._logger.info("[query] ", query);

        let apiName : string | null | undefined = undefined;
        let version : string | undefined = undefined;

        if (!_.isUndefined(query.apiName))
        {
            if (query.apiName.length === 0)
            {
                apiName = null;
            }
            else
            {
                apiName = query.apiName;
            }
        }
        else
        {
            throw new Error("apiName is not specified.");
        }

        version = query.version;

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
            results = results.filter(x => x.metadata?.name && nameDict[x.metadata?.name]);
        }
        else
        {
            results = resourceClient.queryAllSync(query.namespace ?? undefined);
        }

        this._logger.info("[query] result count: %s", results.length);


        const manifests = results.map(x => this._makeManifest(x));

        // TODO: Try using label filter as an optimization inside resourceClient

        const filtering = new ClientSideFiltering(manifests);
        filtering.applyLabelFilter(query.labelFilters);
        return filtering.items;
    }

    private _makeManifest(config: KubernetesObject) : K8sManifest
    {
        const k8sObject = config as K8sObject;
        const source = this._manifestPackage.getSource("k8s", "live", null);
        const k8sManifest = new K8sManifest(k8sObject, source);
        return k8sManifest;
    }

}