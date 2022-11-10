import _ from 'the-lodash'
import { Scope } from '../scope'
import { K8sTarget } from './k8s-target-builder';
import { TopLevelQuery } from './types';
import { RootScopeBuilder } from '../scope-builders'
import { ExecutionContext } from '../execution-context';

export function makeTargetRootScope(rootScopeBuilder : RootScopeBuilder, executionContext : ExecutionContext, scope: Scope)
{
    rootScopeBuilder.setup(TopLevelQuery.ApiVersion, (apiVersion: string) => {
        const target = new K8sTarget(scope, executionContext);
        return target.ApiVersion(apiVersion);
    });

    rootScopeBuilder.setup(TopLevelQuery.Api, (apiOrNone?: string) => {
        const target = new K8sTarget(scope, executionContext);
        return target.Api(apiOrNone);
    });
}
