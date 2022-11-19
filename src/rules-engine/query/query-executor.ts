import { ILogger } from "the-logger";
import { ExecutionContext } from "../execution/execution-context";
import { BaseTargetQuery, TargetQueryKind } from "../query-spec/base";
import { IQueryExecutor, QueryResult } from "./base";
import { K8sQueryExecutor } from "./k8s-query-executor";

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
        this._resolvers[TargetQueryKind.K8s] = new K8sQueryExecutor(this._executionContext);
    }

    execute(query: BaseTargetQuery) : QueryResult
    {
        const resolver = this._resolvers[query.kind];
        if (!resolver) {
            return {
                success: false,
                messages: [
                    `Internal Error. Unknown query kind: ${query.kind}`
                ]
            };
        }
        
        return resolver.execute(query);
    }
}
