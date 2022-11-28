import _ from 'the-lodash'
import { ILogger } from 'the-logger/dist';
import { ExecutionContext } from '../execution/execution-context';
import { QueryExecutorScope } from '../query/query-executor-scope';
import { QueryScopeLimiter, SyncBaseTargetQuery } from './base';
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
        const queryExecutorScope = new QueryExecutorScope(this._executionContext, limiter);

        const wrapper = (...args : any[]) => {

            const queryTarget = this._queryBuilder.apply(null, args) as SyncBaseTargetQuery;

            queryTarget.many = () => {
                return queryExecutorScope.many(queryTarget);
            };

            queryTarget.single = () => {
                return queryExecutorScope.single(queryTarget);
            };

            queryTarget.count = () => {
                return queryExecutorScope.count(queryTarget);
            };

            return queryTarget;
        };

        return wrapper;
    }
}
