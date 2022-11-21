
import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { ExecutionContext } from '../../execution/execution-context';
import { QueryResult } from '../base';
import { IQueryExecutor } from '../base';
import { QueryScopeLimiter } from '../../query-spec/base';
import { FilterTargetQuery } from '../../query-spec/filter/filter-target-query';

export class FilterQueryExecutor implements IQueryExecutor<FilterTargetQuery>
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;

    constructor(executionContext : ExecutionContext)
    {
        this._executionContext = executionContext;
        this._logger = executionContext.logger.sublogger("FilterQueryExecutor");
    }

    execute(query: FilterTargetQuery, limiter: QueryScopeLimiter) : QueryResult
    {
        const result : QueryResult = {
            success: true,
            items: []
        };

        const innerResult = this._executionContext.queryExecutor.execute(query._inner, limiter);

        if (innerResult.items)
        {
            for(const item of innerResult.items)
            {
                if (query._func)
                {
                    if (query._func(item))
                    {
                        result.items!.push(item);
                    }
                }
            }
        }
    
        return result;
    }

}