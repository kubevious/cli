
import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { ExecutionContext } from '../../execution/execution-context';
import { QueryResult } from '../base';
import { IQueryExecutor } from '../base';
import { BaseTargetQuery, QueryScopeLimiter } from '../../query-spec/base';
import { ShortcutTargetQuery } from '../../query-spec/shortcut/shortcut-target-query';
import { TARGET_QUERY_BUILDER_OBJ } from '../../query-spec/scope-builder';
import { setup } from './library';

export type ShortcutFunc = () => BaseTargetQuery;

export class ShortcutQueryExecutor implements IQueryExecutor<ShortcutTargetQuery>
{
    private _logger : ILogger;
    private _executionContext : ExecutionContext;

    private _shortcuts : Record<string, ShortcutFunc> = {};

    constructor(executionContext : ExecutionContext)
    {
        this._executionContext = executionContext;
        this._logger = executionContext.logger.sublogger("ShortcutQueryExecutor");

        setup(this);
    }

    execute(query: ShortcutTargetQuery, limiter: QueryScopeLimiter) : QueryResult
    {
        const shortcutFunc = this._shortcuts[query._name!];
        if (!shortcutFunc) {
            return {
                success: false,
                messages: [`Unknown shortcut: ${query._name}`]
            }
        }

        const shortcut = shortcutFunc();
        return this._executionContext.queryExecutor.execute(shortcut, limiter);
    }

    setup(name: string, func: ShortcutFunc)
    {
        this._shortcuts[name] = func;
    }

}