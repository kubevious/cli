
import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { ExecutionContext } from '../../execution/execution-context';
import { QueryResult } from '../base';
import { IQueryExecutor } from '../base';
import { QueryScopeLimiter } from '../../query-spec/base';
import { FirstTargetQuery } from '../../query-spec/first/first-target-query';

export class FirstQueryExecutor implements IQueryExecutor<FirstTargetQuery>
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;

    constructor(executionContext : ExecutionContext)
    {
        this._executionContext = executionContext;
        this._logger = executionContext.logger.sublogger("FirstQueryExecutor");
    }

    execute(query: FirstTargetQuery, limiter: QueryScopeLimiter) : QueryResult
    {
        for(const innerQuery of query._inner)
        {
            const innerResult = this._executionContext.queryExecutor.execute(innerQuery, limiter);
            if (innerResult.items)
            {
                const item = _.head(innerResult.items);
                if (item) {
                    return {
                        success: true,
                        items: [item]
                    }
                }
            }
        }

        return {
            success: false,
            items: []
        }
    }

}