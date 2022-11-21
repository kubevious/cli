import { ILogger } from "the-logger";
import { ExecutionContext } from "../execution/execution-context";
import { BaseTargetQuery, QueryScopeLimiter, TargetQueryKind } from "../query-spec/base";
import { IQueryExecutor, QueryResult } from "./base";
import { FilterQueryExecutor } from "./filter/filter-query-executor";
import { K8sQueryExecutor } from "./k8s/k8s-query-executor";
import { ShortcutQueryExecutor } from "./shortcut/shortcut-query-executor";
import { TransformQueryExecutor } from "./transform/transform-query-executor";
import { UnionQueryExecutor } from "./union/union-query-executor";

export class QueryExecutor implements IQueryExecutor<BaseTargetQuery>
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;
    private _resolvers: Record<string, IQueryExecutor<BaseTargetQuery>> = {};

    constructor(executionContext : ExecutionContext)
    {
        this._logger = executionContext.logger.sublogger("QueryExecutor");
        this._executionContext = executionContext;

        this._setup();
    }

    private _setup()
    {
        this._resolvers[TargetQueryKind.Shortcut] = new ShortcutQueryExecutor(this._executionContext);
        this._resolvers[TargetQueryKind.K8s] = new K8sQueryExecutor(this._executionContext);
        this._resolvers[TargetQueryKind.Union] = new UnionQueryExecutor(this._executionContext);
        this._resolvers[TargetQueryKind.Transform] = new TransformQueryExecutor(this._executionContext);
        this._resolvers[TargetQueryKind.Filter] = new FilterQueryExecutor(this._executionContext);
    }

    execute(query: BaseTargetQuery, limiter: QueryScopeLimiter) : QueryResult
    {
        this._logger.info("[execute] %s", query.kind);

        const resolver = this._resolvers[query.kind];
        if (!resolver) {
            this._logger.error("Internal Error. Unknown query kind: %s", query.kind);

            return {
                success: false,
                messages: [
                    `Internal Error. Unknown query kind: ${query.kind}`
                ]
            };
        }
        
        return resolver.execute(query, limiter);
    }
}
