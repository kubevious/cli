import _ from 'the-lodash'
import { RootScopeBuilder } from '../scope-builders'
import { ScriptItem } from '../script-item';
import { ExecutionContext } from '../execution/execution-context';
import { QueryableK8sTarget } from './queryable-k8s-target';
import { Scope } from '../scope';
import { TopLevelQuery } from '../target/types';

export function buildQueryableTargetScope(rootScopeBuilder : RootScopeBuilder, item: ScriptItem, executionContext: ExecutionContext)
{

    rootScopeBuilder.setup(TopLevelQuery.ApiVersion, (apiVersion: string) => {
        const scope = new Scope();

        const target = new QueryableK8sTarget(scope, executionContext, item);
        const builder = target.ApiVersion(apiVersion);

        return builder;
    });

    rootScopeBuilder.setup(TopLevelQuery.Api, (apiOrNone?: string) => {
        const scope = new Scope();

        const target = new QueryableK8sTarget(scope, executionContext, item);
        const builder = target.Api(apiOrNone);

        return builder;
    });
    
}
