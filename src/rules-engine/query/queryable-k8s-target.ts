import _ from 'the-lodash';
import { ExecutionContext } from '../execution/execution-context';
import { QueryFetcher } from './fetcher';
import { Scope } from '../scope'
import { ScriptItem } from '../script-item';
import { K8sTarget, K8sTargetBuilder, K8sTargetBuilderContext } from '../target/k8s-target-builder';

class QueryableK8sTargetBuilder extends K8sTargetBuilder
{
    many() {
        return executeScopeQueryMany(this._scope, this._executionContext, this._builderContext);
    }

    single() {
        return executeScopeQuerySingle(this._scope, this._executionContext, this._builderContext);
    }

    count() {
        return executeScopeQueryCount(this._scope, this._executionContext, this._builderContext);
    }
}

export class QueryableK8sTarget extends K8sTarget
{
    private _builderContext: K8sTargetBuilderContext = {};

    constructor(scope: Scope, executionContext: ExecutionContext, item: ScriptItem)
    {
        super(scope, executionContext);

        this._builderContext.namespace = item.config?.metadata?.namespace;
    }

    protected _makeTargetBuilder()
    {
        return new QueryableK8sTargetBuilder(this._scope, this._executionContext, this._builderContext);
    }
}


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
