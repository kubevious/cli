import _ from 'the-lodash'
import { ILogger } from 'the-logger/dist';
import { ExecutionContext } from '../execution/execution-context';
import { BaseTargetQuery, SyncBaseTargetQuery } from './base';
import { buildQueryScopes, TargetQueryFunc } from './scope-builder';

export type SyncTargetQueryFunc = (...args : any[]) => SyncBaseTargetQuery;

export function buildQueryableScope(executionContext : ExecutionContext) : Record<string, SyncTargetQueryFunc>
{
    const queryBuildersDict = buildQueryScopes(executionContext);

    const syncQueryBuilder : Record<string, SyncTargetQueryFunc> = {};

    for(const key of _.keys(queryBuildersDict))
    {
        const builder = queryBuildersDict[key];
        const syncQuery = new SyncQueryBuilder(executionContext, builder);

        syncQueryBuilder[key] = syncQuery.wrap();
    }

    return syncQueryBuilder;
}

class SyncQueryBuilder
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;
    private _queryBuilder: TargetQueryFunc;
    
    constructor(executionContext : ExecutionContext, queryBuilder: TargetQueryFunc)
    {
        this._executionContext = executionContext;
        this._queryBuilder = queryBuilder;
        this._logger = this._executionContext.logger.sublogger("SyncQueryBuilder");
    }

    wrap()
    {
        const wrapper = (...args : any[]) => {

            const queryTarget = this._queryBuilder.apply(null, args) as SyncBaseTargetQuery;

            queryTarget.many = () => {
                return this._executeQuery(queryTarget);
            };

            queryTarget.single = () => {
                return _.head(this._executeQuery(queryTarget)) ?? null;
            };

            queryTarget.count = () => {
                return this._executeQuery(queryTarget).length;
            };

            return queryTarget;
        };

        return wrapper;
    }

    private _executeQuery(queryTarget: BaseTargetQuery)
    {
        const result = this._executionContext.queryExecutor.execute(queryTarget);
        return result.items ?? [];
    }
}
