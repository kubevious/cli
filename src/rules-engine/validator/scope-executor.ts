import _ from 'the-lodash';
import { ExecutionContext } from '../execution-context';
import { QueryFetcher } from '../query/fetcher';
import { Scope } from '../scope';

export function executeScopeQueryMany(scope: Scope, executionContext : ExecutionContext)
{
    scope.finalize();

    const fetcher = new QueryFetcher(executionContext, scope);
    const result = fetcher.execute();

    if (!result.success) {
        return [];
    }

    return result.items;
}

export function executeScopeQuerySingle(scope: Scope, executionContext : ExecutionContext)
{
    const items = executeScopeQueryMany(scope, executionContext);
    return _.head(items);
}

export function executeScopeQueryCount(scope: Scope, executionContext : ExecutionContext)
{
    const items = executeScopeQueryMany(scope, executionContext);
    return items.length;
}