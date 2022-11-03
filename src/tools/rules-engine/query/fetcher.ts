import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { Promise } from 'the-promise';
import { ScriptItem } from '../script-item';
import { ExecutionContext } from '../execution-context';
import { ScopeK8sQuery } from '../target/k8s-target-builder';
import { Scope } from '../scope';

export interface QueryResult {
    success: boolean
    messages?: string[]
    items: ScriptItem[]
}

export class QueryFetcher
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;
    private _scope: Scope;

    private _result: QueryResult = {
        success: false,
        items: [],
        messages: [],
    };

    constructor(executionContext : ExecutionContext, scope: Scope)
    {
        this._executionContext = executionContext;
        this._scope = scope;
        this._logger = executionContext.logger.sublogger("QueryFetcher");
    }

    execute(): QueryResult
    {
        this._logger.info("[execute] RUNNING QUERY....")

        const k8sQuery = this._scope.query as ScopeK8sQuery;

        const manifests = this._executionContext.registryQueryExecutor.query(k8sQuery.filter);
        this._result.success = true;
        for(const x of manifests)
        {
            this._result.items.push(new ScriptItem(x));
        }
        this._logger.info("[execute]     RESULT COUNT: %s", this._result.items.length);
    
        return this._result;
    }

}