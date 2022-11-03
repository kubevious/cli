import _ from 'the-lodash'
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
    }

    execute(): QueryResult
    {
        const k8sQuery = this._scope.query as ScopeK8sQuery;

        const configs = this._executionContext.registryQueryExecutor.query(k8sQuery.filter);
        this._result.success = true;
        for(const x of configs)
        {
            this._result.items.push(new ScriptItem(x));
        }
    
        return this._result;
    }

}