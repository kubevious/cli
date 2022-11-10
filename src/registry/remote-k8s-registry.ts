import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sManifest } from '../manifests/manifest-package';
import { sanitizeDnPath } from '@kubevious/entity-meta';
import { makeK8sKeyStr } from '../types/k8s';
import { K8sTargetFilter } from '../rules-engine/target/k8s-target-builder';
import { RegistryQueryExecutor } from '../rules-engine/query-executor';
import { K8sClusterConnector } from '../k8s-connector/k8s-cluster-connector';
import { KubernetesClient } from 'k8s-super-client';

export class RemoteK8sRegistry implements RegistryQueryExecutor
{
    private _logger: ILogger;
    private _k8sConnector: K8sClusterConnector;
    private _client: KubernetesClient;

    private _dict : {
        [key: string]: K8sManifest
    } = {};

    constructor(logger: ILogger, k8sConnector: K8sClusterConnector)
    {
        this._logger = logger.sublogger('RemoteK8sRegistry');
        this._k8sConnector = k8sConnector;
        this._client = k8sConnector.client!;
    }

    async test()
    {
        const x = this._client.client('Rule', 'kubevious.io');
        const items = x!.queryAllSync();//'default');
        this._logger.info("ALL RULES: ", items.map(x => `${x.metadata.namespace} :: ${x.metadata.name}`));
    }

    query(query: K8sTargetFilter) : K8sManifest[]
    {
        this._logger.info("[query] XXXX: ", query);
        // throw new Error('ZZZZZ')

        const resourceClient = this._client.client("", "");
        // resourceClient?.queryAll()

        let results = _.values(this._dict);

        // if (query.isApiVersion) {
        //     results = results.filter(x => x.id.apiVersion === query.apiVersion);
        // } else {
        //     if (query.apiOrNone) {
        //         results = results.filter(x => x.id.api === query.apiOrNone);
        //     } else {
        //         results = results.filter(x => !x.id.api);
        //     }

        //     if (query.version) {
        //         results = results.filter(x => x.id.version === query.version);
        //     }
        // }

        // if (query.kind) {
        //     results = results.filter(x => x.id.kind === query.kind);
        // }

        // if (query.namespace) {
        //     results = results.filter(x => x.id.namespace === query.namespace);
        // }

        // if (query.nameFilters && query.nameFilters.length > 0) {
        //     const nameDict = _.makeBoolDict(query.nameFilters);
        //     results = results.filter(x => x.id.name && nameDict[x.id.name]);
        // }

        // if (query.labelFilters && query.labelFilters.length > 0) {
        //     results = results.filter(x => this._doesAnyMatch(query.labelFilters!, (labelFilter) => {
        //         for (const key of _.keys(labelFilter)) {
        //             const labels = x.config.metadata?.labels ?? {};
        //             if (labels[key] != labelFilter[key]) {
        //                 return false
        //             }
        //         }
        //         return true;
        //     }));
        // }

        return results;
    }

    private _doesAnyMatch<T>(matchers: T[], cb: ((value: T) => boolean)) : boolean {
        if (matchers.length == 0) {
            return true;
        }

        for(const matcher of matchers) {
            const isMatch = cb(matcher);
            if (isMatch) {
                return true;
            }
        }
        return false;
    }

    async debugOutputToDir(logger: ILogger, relPath: string) : Promise<void>
    {
        for(const key of _.keys(this._dict))
        {
            const filePath = `${relPath}/${sanitizeDnPath(key)}.json`;
            const manifest = this._dict[key];
            await logger.outputFile(filePath, manifest.config);
        }
    }

}