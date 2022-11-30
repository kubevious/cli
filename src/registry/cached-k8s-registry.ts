import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sTargetFilter } from '../rules-engine/query-spec/k8s/k8s-target-query';
import { RegistryQueryExecutor } from '../rules-engine/query-executor';
import { K8sManifest } from '../manifests/k8s-manifest';

export class CachedK8sRegistry implements RegistryQueryExecutor
{
    private _logger: ILogger;
    private _innerRegistry: RegistryQueryExecutor;

    private _cache : Record<string, K8sManifest[]> = {};

    constructor(logger: ILogger, innerRegistry: RegistryQueryExecutor)
    {
        this._logger = logger.sublogger('CachedK8sRegistry');
        this._innerRegistry = innerRegistry;
    }

    query(query: K8sTargetFilter) : K8sManifest[]
    {
        // this._logger.info("[query] ", query);

        const key = _.stableStringify(query);
        const cachedResult = this._cache[key];
        if (_.isNotNullOrUndefined(cachedResult)) {
            return cachedResult;
        }

        const result = this._innerRegistry.query(query);
        this._cache[key] = result;
        return result;
    }

}