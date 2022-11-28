
import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { ExecutionContext } from '../../execution/execution-context';
import { QueryResult } from '../base';
import { IQueryExecutor } from '../base';
import { QueryScopeLimiter } from '../../query-spec/base';
import { ManualQueryFuncArgs, ManualTargetQuery } from '../../query-spec/manual/manual-target-query';
import { QueryExecutorScope } from '../query-executor-scope';

export class ManualQueryExecutor implements IQueryExecutor<ManualTargetQuery>
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;

    constructor(executionContext : ExecutionContext)
    {
        this._executionContext = executionContext;
        this._logger = executionContext.logger.sublogger("ManualQueryExecutor");
    }

    execute(query: ManualTargetQuery, limiter: QueryScopeLimiter) : QueryResult
    {
        const result : QueryResult = {
            success: true,
            items: []
        };

        const func = query._func;
        if (func) 
        {
            const queryScope = new QueryExecutorScope(this._executionContext, limiter);
            const funcArgs : ManualQueryFuncArgs = {
                many: (innerQuery) => queryScope.many(innerQuery),
                single: (innerQuery) => queryScope.single(innerQuery),
                count: (innerQuery) => queryScope.count(innerQuery)
            }

            const scriptItems = func(funcArgs) ?? [];
            for (const item of scriptItems)
            {
                result.items!.push(item);
            }
        }
    
        return result;
    }

}