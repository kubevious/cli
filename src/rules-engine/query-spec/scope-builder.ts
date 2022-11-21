import _ from 'the-lodash'
import { K8sTargetQuery } from './k8s/k8s-target-query';
import { UnionTargetQuery } from './union/union-target-query';
import { TransformTargetQuery } from './transform/transform-target-query';
import { BaseTargetQuery, TopLevelQuery } from './base';

export class TargetQueryBuilderDef
{
    get ApiVersion() {
        return (apiVersion: string) => {
            const target = new K8sTargetQuery();
            return target.ApiVersion(apiVersion);
        }
    }

    get Api() {
        return (apiOrNone?: string) => {
            const target = new K8sTargetQuery();
            return target.Api(apiOrNone);
        }
    }

    get Union() {
        return (...inner: BaseTargetQuery[]) => {
            return new UnionTargetQuery(...inner);
        }   
    }

    get Transform() {
        return (inner: BaseTargetQuery) => {
            return new TransformTargetQuery(inner);
        }
    }
}

export const TARGET_QUERY_BUILDER_OBJ = new TargetQueryBuilderDef();

export type TargetQueryFunc = (...args : any[]) => BaseTargetQuery;

export const TARGET_QUERY_BUILDER_DICT : Record<string, TargetQueryFunc> = {
    [TopLevelQuery.ApiVersion]: TARGET_QUERY_BUILDER_OBJ.ApiVersion,

    [TopLevelQuery.Api]: TARGET_QUERY_BUILDER_OBJ.Api,

    [TopLevelQuery.Union]: TARGET_QUERY_BUILDER_OBJ.Union,

    [TopLevelQuery.Transform]: TARGET_QUERY_BUILDER_OBJ.Transform
}