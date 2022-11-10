import _ from 'the-lodash';
import { ExecutionContext } from '../execution-context';
import { QueryFetcher } from '../query/fetcher';
import { Scope } from '../scope';
import { K8sTargetBuilderContext } from '../target/k8s-target-builder';

export function executeScopeQueryMany(scope: Scope, executionContext : ExecutionContext, builderContext: K8sTargetBuilderContext)
{
    scope.finalize();

    const fetcher = new QueryFetcher(executionContext, scope);
    const result = fetcher.execute(builderContext);

    if (!result.success) {
        return [];
    }

    return result.items;
}

export function executeScopeQuerySingle(scope: Scope, executionContext : ExecutionContext, builderContext: K8sTargetBuilderContext)
{
    const items = executeScopeQueryMany(scope, executionContext, builderContext);
    return _.head(items);
}

export function executeScopeQueryCount(scope: Scope, executionContext : ExecutionContext, builderContext: K8sTargetBuilderContext)
{
    const items = executeScopeQueryMany(scope, executionContext, builderContext);
    return items.length;
}