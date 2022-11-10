import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { makeK8sKeyStr } from '../types/k8s';
import { K8sTargetFilter } from '../rules-engine/target/k8s-target-builder';
import { RegistryQueryExecutor } from '../rules-engine/query-executor';
import { K8sManifest } from '../manifests/k8s-manifest';

export class CombinedRegistry implements RegistryQueryExecutor
{
    private _logger: ILogger;
    private _innerRegistries: RegistryQueryExecutor[];

    constructor(logger: ILogger, innerRegistries: RegistryQueryExecutor[])
    {
        this._logger = logger.sublogger('LocalK8sRegistry');
        this._innerRegistries = innerRegistries;
    }

    query(query: K8sTargetFilter) : K8sManifest[]
    {
        const dict : Record<string, K8sManifest> = {};

        for(const registry of this._innerRegistries)
        {
            const manifests = registry.query(query);
            for(const x of manifests)
            {
                if (!dict[x.idKey]) {
                    dict[x.idKey] = x;
                }
            }
        }

        return _.values(dict);
    }

}