
import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { ScriptItem } from '../../script-item';
import { ExecutionContext } from '../../execution/execution-context';
import { QueryResult } from '../base';
import { IQueryExecutor } from '../base';
import { QueryScopeLimiter } from '../../query-spec/base';
import { TransformTargetQuery } from '../../query-spec/transform/transform-target-query';
import { K8sManifest } from '../../../manifests/k8s-manifest';

export class TransformQueryExecutor implements IQueryExecutor<TransformTargetQuery>
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;

    constructor(executionContext : ExecutionContext)
    {
        this._executionContext = executionContext;
        this._logger = executionContext.logger.sublogger("TransformQueryExecutor");
    }

    execute(query: TransformTargetQuery, limiter: QueryScopeLimiter) : QueryResult
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
                    const k8sObj = query._func(item);
                    const manifest = new K8sManifest(k8sObj, item.manifest.source);
                    result.items!.push(new ScriptItem(manifest));
                }
            }
        }
    
        return result;
    }

}