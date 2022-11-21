import { BaseTargetQuery, QueryScopeLimiter } from "../query-spec/base";
import { ScriptItem } from "../script-item";

export interface IQueryExecutor<T extends BaseTargetQuery>
{
    execute(query: T, limiter: QueryScopeLimiter) : QueryResult;
}

export interface QueryResult {
    success: boolean,
    messages?: string[],
    items?: ScriptItem[],
}
