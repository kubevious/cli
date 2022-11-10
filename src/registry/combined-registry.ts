import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sManifest } from '../manifests/manifest-package';
import { makeK8sKeyStr } from '../types/k8s';
import { K8sTargetFilter } from '../rules-engine/target/k8s-target-builder';
import { RegistryQueryExecutor } from '../rules-engine/query-executor';

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
                const key = makeK8sKeyStr(x.config);
                if (!dict[key]) {
                    dict[key] = x;
                }
            }
        }

        return _.values(dict);
    }

}