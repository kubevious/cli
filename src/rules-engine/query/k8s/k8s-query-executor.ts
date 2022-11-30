
import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { ScriptItem } from '../../script-item';
import { ExecutionContext } from '../../execution/execution-context';
import { K8sTargetQuery } from '../../query-spec/k8s/k8s-target-query';
import { QueryResult } from '../base';
import { IQueryExecutor } from '../base';
import { QueryScopeLimiter } from '../../query-spec/base';
import { RegistryQueryOptions } from '../../query-executor';


export class K8sQueryExecutor implements IQueryExecutor<K8sTargetQuery>
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;

    constructor(executionContext : ExecutionContext)
    {
        this._executionContext = executionContext;
        this._logger = executionContext.logger.sublogger("K8sQueryExecutor");
    }

    execute(query: K8sTargetQuery, limiter: QueryScopeLimiter) : QueryResult
    {
        // this._logger.info("[execute] RUNNING QUERY....");

        const queryData = query._data;

        if (!queryData.kind) {
            // this._logger.info("[execute] Exiting. No Kind...");
            return {
                success: false,
                messages: ['Kind not set'], 
            }
        }

        if (_.isUndefined(queryData.apiName)) {
            // this._logger.info("[execute] Exiting. No ApiName...");
            return {
                success: false,
                messages: ['apiName not set'], 
            }
        }

        const k8sQueryFilter : RegistryQueryOptions = {
            apiName: queryData.apiName,
            version: queryData.version,
            kind: queryData.kind,
        
            nameFilters: queryData.nameFilters,
            labelFilters: queryData.labelFilters,
        }

        const isClusterScope = queryData.isClusterScope;
        if (!isClusterScope)
        {
            if (!queryData.isAllNamespaces)
            {
                k8sQueryFilter.namespace = (queryData.namespace ?? limiter.namespace) || undefined;
            }
        }
        // this._logger.info("[execute] Filter: ", k8sQueryFilter);

        const manifests = this._executionContext.registryQueryExecutor.query(k8sQueryFilter);

        const result : QueryResult = {
            success: true,
            items: manifests.map(x => new ScriptItem(x))
        };

        // this._logger.info("[execute]     RESULT COUNT: %s", result.items!.length);
    
        return result;
    }

}