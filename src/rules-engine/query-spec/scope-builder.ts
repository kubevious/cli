import _ from 'the-lodash'
import { K8sTargetQuery } from './k8s-target-query';
import { UnionTargetQuery } from './union-target-query';
import { TransformTargetQuery } from './transform-target-query';
import { BaseTargetQuery, TopLevelQuery } from './base';

export type TargetQueryFunc = (...args : any[]) => BaseTargetQuery;

export function buildQueryScopes() : Record<string, TargetQueryFunc>
{
    return {
        [TopLevelQuery.ApiVersion]: (apiVersion: string) => {
            const target = new K8sTargetQuery();
            return target.ApiVersion(apiVersion);
        },

        [TopLevelQuery.Api]: (apiOrNone?: string) => {
            const target = new K8sTargetQuery();
            return target.Api(apiOrNone);
        },

        [TopLevelQuery.Union]: (...inner: BaseTargetQuery[]) => {
            return new UnionTargetQuery(...inner);
        },

        [TopLevelQuery.Transform]: (inner: BaseTargetQuery) => {
            return new TransformTargetQuery(inner);
        }
    }
}