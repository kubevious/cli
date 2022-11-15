import _ from 'the-lodash'
import { RootScopeBuilder } from '../scope-builders'
import { ExecutionContext } from '../execution/execution-context';
import { QueryableK8sTarget } from './queryable-k8s-target';
import { Scope } from '../scope';
import { TopLevelQuery } from '../compiler/target/types';

export function buildQueryableTargetScope(rootScopeBuilder : RootScopeBuilder, targetNamespace: string | null | undefined, executionContext: ExecutionContext)
{

    rootScopeBuilder.setup(TopLevelQuery.ApiVersion, (apiVersion: string) => {
        const scope = new Scope();

        const target = new QueryableK8sTarget(scope, executionContext, targetNamespace);
        const builder = target.ApiVersion(apiVersion);

        return builder;
    });

    rootScopeBuilder.setup(TopLevelQuery.Api, (apiOrNone?: string) => {
        const scope = new Scope();

        const target = new QueryableK8sTarget(scope, executionContext, targetNamespace);
        const builder = target.Api(apiOrNone);

        return builder;
    });
    
}
