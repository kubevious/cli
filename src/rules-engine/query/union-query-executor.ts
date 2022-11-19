
import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { ScriptItem } from '../script-item';
import { ExecutionContext } from '../execution/execution-context';
import { QueryResult } from './base';
import { IQueryExecutor } from './base';
import { UnionTargetQuery } from '../query-spec/union-target-query';

export class UnionQueryExecutor implements IQueryExecutor<UnionTargetQuery>
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;

    constructor(executionContext : ExecutionContext)
    {
        this._executionContext = executionContext;
        this._logger = executionContext.logger.sublogger("UnionQueryExecutor");
    }

    execute(query: UnionTargetQuery) : QueryResult
    {
        const _dict : Record<string, ScriptItem> = {};

        for(const innerQuery of query._inner)
        {
            const innerResult = this._executionContext.queryExecutor.execute(innerQuery);

            if (innerResult.items)
            {
                for(const item of innerResult.items)
                {
                    _dict[item.manifest.idKey] = item;
                }
            }
        }

        const result : QueryResult = {
            success: true,
            items: _.values(_dict)
        };
    
        return result;
    }

}