import _ from 'the-lodash'
import { ExecutionContext } from '../execution/execution-context';
import { TopLevelQuery } from '../compiler/target/types';
import { K8sTarget } from '../compiler/target/k8s-target-builder';
import { UnionTargetQuery } from './union-target-query';
import { BaseTargetQuery } from './base';

export type TargetQueryFunc = (...args : any[]) => BaseTargetQuery;

export function buildQueryScopes(executionContext : ExecutionContext) : Record<string, TargetQueryFunc>
{
    return {
        [TopLevelQuery.ApiVersion]: (apiVersion: string) => {
            const target = new K8sTarget(executionContext);
            return target.ApiVersion(apiVersion);
        },

        [TopLevelQuery.Api]: (apiOrNone?: string) => {
            const target = new K8sTarget(executionContext);
            return target.Api(apiOrNone);
        },

        [TopLevelQuery.Union]: (...inner: BaseTargetQuery[]) => {

            return new UnionTargetQuery(...inner);
            
        }
    }
}