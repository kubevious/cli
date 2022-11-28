import _ from 'the-lodash';
import { ILogger } from "the-logger";
import { ExecutionContext } from "../execution/execution-context";
import { BaseTargetQuery, QueryScopeLimiter } from "../query-spec/base";
import { ScriptItem } from '../script-item';

export class QueryExecutorScope
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;
    private _limiter: QueryScopeLimiter;

    constructor(executionContext : ExecutionContext, limiter: QueryScopeLimiter)
    {
        this._logger = executionContext.logger.sublogger("QueryExecutorScope");
        this._executionContext = executionContext;
        this._limiter = limiter;
    }

    many(query: BaseTargetQuery) : ScriptItem[]
    {
        const result = this._executionContext.queryExecutor.execute(query, this._limiter);
        if (result.messages) {
            for(const x of result.messages) {
                this._logger.error("Error in query: %s", x);
            }
        }
        return result.items ?? [];
    }

    single(query: BaseTargetQuery) : ScriptItem | null
    {
        return _.head(this.many(query)) ?? null;
    }

    count(query: BaseTargetQuery) : number
    {
        return this.many(query).length;
    }
}
