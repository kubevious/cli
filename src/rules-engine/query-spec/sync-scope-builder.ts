import _ from 'the-lodash'
import { ILogger } from 'the-logger/dist';
import { ExecutionContext } from '../execution/execution-context';
import { BaseTargetQuery, QueryScopeLimiter, SyncBaseTargetQuery } from './base';
import { TargetQueryFunc, TARGET_QUERY_BUILDER_DICT } from './scope-builder';

export type SyncTargetQueryFunc = (...args : any[]) => SyncBaseTargetQuery;

export function buildQueryableScope(executionContext : ExecutionContext, limiter: QueryScopeLimiter) : Record<string, SyncTargetQueryFunc>
{
    const syncQueryBuilder : Record<string, SyncTargetQueryFunc> = {};

    for(const key of _.keys(TARGET_QUERY_BUILDER_DICT))
    {
        const builder = TARGET_QUERY_BUILDER_DICT[key];
        const syncQuery = new SyncQueryBuilder(executionContext, builder);

        syncQueryBuilder[key] = syncQuery.wrap(limiter);
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

    wrap(limiter: QueryScopeLimiter)
    {
        const wrapper = (...args : any[]) => {

            const queryTarget = this._queryBuilder.apply(null, args) as SyncBaseTargetQuery;

            queryTarget.many = () => {
                return this._executeQuery(queryTarget, limiter);
            };

            queryTarget.single = () => {
                return _.head(this._executeQuery(queryTarget, limiter)) ?? null;
            };

            queryTarget.count = () => {
                return this._executeQuery(queryTarget, limiter).length;
            };

            return queryTarget;
        };

        return wrapper;
    }

    private _executeQuery(queryTarget: BaseTargetQuery, limiter: QueryScopeLimiter)
    {
        const result = this._executionContext.queryExecutor.execute(queryTarget, limiter);
        return result.items ?? [];
    }
}
