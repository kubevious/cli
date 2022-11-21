
import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { ScriptItem } from '../../script-item';
import { ExecutionContext } from '../../execution/execution-context';
import { K8sTargetQuery, K8sTargetFilter } from '../../query-spec/k8s/k8s-target-query';
import { QueryResult } from '../base';
import { IQueryExecutor } from '../base';
import { QueryScopeLimiter } from '../../query-spec/base';


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
        this._logger.info("[execute] RUNNING QUERY....");

        const queryData = query._data;

        if (!queryData.kind) {
            console.log("No Kind");
            return {
                success: false,
                messages: ['Kind not set'], 
            }
        }

        const apiVersion = queryData.isApiVersion ? queryData.apiVersion : 
            (queryData.apiOrNone ? `${queryData.apiOrNone}/${queryData.version}` : queryData.version);

        if (!apiVersion) {
            console.log("No ApiVersion");
            return {
                success: false,
                messages: ['No ApiVersion not set'], 
            }
        }

        const k8sQueryFilter : K8sTargetFilter = {
            isApiVersion: true,
            apiVersion: apiVersion,
            kind: queryData.kind,
            namespace: queryData.namespace,
            isAllNamespaces: queryData.isAllNamespaces,
        
            nameFilters: queryData.nameFilters,
            labelFilters: queryData.labelFilters,
        }


        // TODO: Handle Clustered Case Properly.
        const isAllNamespaces = k8sQueryFilter.isAllNamespaces ?? false;
        if (!isAllNamespaces) {
            if (limiter.namespace) {
                k8sQueryFilter.namespace = limiter.namespace;
            }
        }

        const manifests = this._executionContext.registryQueryExecutor.query(k8sQueryFilter);

        const result : QueryResult = {
            success: true,
            items: manifests.map(x => new ScriptItem(x))
        };

        this._logger.info("[execute]     RESULT COUNT: %s", result.items!.length);
    
        return result;
    }

}