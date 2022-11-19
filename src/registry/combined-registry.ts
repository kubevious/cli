import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sTargetFilter } from '../rules-engine/query-spec/k8s-target-query';
import { RegistryQueryExecutor } from '../rules-engine/query-executor';
import { K8sManifest } from '../manifests/k8s-manifest';

export class CombinedRegistry implements RegistryQueryExecutor
{
    private _logger: ILogger;
    private _innerRegistries: RegistryQueryExecutor[];

    constructor(logger: ILogger, innerRegistries: RegistryQueryExecutor[])
    {
        this._logger = logger.sublogger('CombinedRegistry');
        this._innerRegistries = innerRegistries;
    }

    query(query: K8sTargetFilter) : K8sManifest[]
    {
        this._logger.info("[query] ", query);

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