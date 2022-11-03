import _ from 'the-lodash'
import { ExecutionState, RootScopeBuilder } from '@kubevious/kubik';
import { Scope } from '@kubevious/kubik/dist/spec/target/scope';
import { K8sTarget } from '@kubevious/kubik/dist/spec/target/root/k8s-target';
import { TopLevelQuery } from './rules-engine/target/types';

export function makeTargetRootScope(rootScopeBuilder : RootScopeBuilder, scope: Scope, executionState: ExecutionState)
{
    rootScopeBuilder.setup(TopLevelQuery.ApiVersion, (apiVersion: string) => {
        const target = new K8sTarget(scope, executionState);
        return target.ApiVersion(apiVersion);
    });
}
