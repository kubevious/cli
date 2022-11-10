import { ExecutionContext } from '../execution-context';
import { Scope, ScopeQueryKind } from '../scope'
import { ScriptItem } from '../script-item';
import { K8sTarget, K8sTargetBuilder, K8sTargetBuilderContext } from '../target/k8s-target-builder';
import { executeScopeQueryCount, executeScopeQueryMany, executeScopeQuerySingle } from './scope-executor';

export class QueryableK8sTargetBuilder extends K8sTargetBuilder
{
    many() {
        return executeScopeQueryMany(this._scope, this._executionContext);
    }

    single() {
        return executeScopeQuerySingle(this._scope, this._executionContext);
    }

    count() {
        return executeScopeQueryCount(this._scope, this._executionContext);
    }
}

export class QueryableK8sTarget extends K8sTarget
{
    private _item: ScriptItem;
    private _builderContext: K8sTargetBuilderContext = {};

    constructor(scope: Scope, executionContext: ExecutionContext, item: ScriptItem)
    {
        super(scope, executionContext);

        this._item = item;
        this._builderContext.namespace = item.config?.metadata?.namespace;
    }

    protected _makeTargetBuilder()
    {
        return new QueryableK8sTargetBuilder(this._scope, this._executionContext, this._builderContext);
    }
}