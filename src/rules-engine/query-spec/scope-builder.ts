import _ from 'the-lodash'
import { K8sTargetQuery } from './k8s/k8s-target-query';
import { UnionTargetQuery } from './union/union-target-query';
import { TransformTargetQuery } from './transform/transform-target-query';
import { BaseTargetQuery } from './base';
import { ShortcutTargetQuery } from './shortcut/shortcut-target-query';
import { FilterTargetQuery } from './filter/filter-target-query';
import { TransformManyTargetQuery } from './transform-many/transform-many-target-query';
import { ManualQueryFunc, ManualTargetQuery } from './manual/manual-target-query';
import { FirstTargetQuery } from './first/first-target-query';

export class TargetQueryBuilderDef
{
    get Shortcut() {
        return (name: string, ...args: any[]) => {
            const target = new ShortcutTargetQuery();
            return target.Shortcut(name, ...args);
        }
    }

    get ApiVersion() {
        return (apiVersion: string) => {
            const target = new K8sTargetQuery();
            return target.ApiVersion(apiVersion);
        }
    }

    get Api() {
        return (apiName: string) => {
            const target = new K8sTargetQuery();
            return target.Api(apiName);
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

    get TransformMany() {
        return (inner: BaseTargetQuery) => {
            return new TransformManyTargetQuery(inner);
        }
    }

    get Filter() {
        return (inner: BaseTargetQuery) => {
            return new FilterTargetQuery(inner);
        }
    }

    get First() {
        return (...inner: BaseTargetQuery[]) => {
            return new FirstTargetQuery(...inner);
        }   
    }

    get Manual() {
        return (func: ManualQueryFunc) => {
            return new ManualTargetQuery(func);
        }
    }

}

export const TARGET_QUERY_BUILDER_OBJ = new TargetQueryBuilderDef();

export type TargetQueryFunc = (...args : any[]) => BaseTargetQuery;


enum TopLevelQuery
{
    Shortcut = 'Shortcut',

    ApiVersion = 'ApiVersion',
    Api = 'Api',

    Union = 'Union',
    Transform = 'Transform',
    TransformMany = 'TransformMany',
    Filter = 'Filter',
    
    Manual = 'Manual',
}

export const TARGET_QUERY_BUILDER_DICT : Record<string, TargetQueryFunc> = {
    [TopLevelQuery.Shortcut]: TARGET_QUERY_BUILDER_OBJ.Shortcut,

    [TopLevelQuery.ApiVersion]: TARGET_QUERY_BUILDER_OBJ.ApiVersion,

    [TopLevelQuery.Api]: TARGET_QUERY_BUILDER_OBJ.Api,

    [TopLevelQuery.Union]: TARGET_QUERY_BUILDER_OBJ.Union,

    [TopLevelQuery.Transform]: TARGET_QUERY_BUILDER_OBJ.Transform,
    [TopLevelQuery.TransformMany]: TARGET_QUERY_BUILDER_OBJ.TransformMany,

    [TopLevelQuery.Filter]: TARGET_QUERY_BUILDER_OBJ.Filter,

    [TopLevelQuery.Manual]: TARGET_QUERY_BUILDER_OBJ.Manual,

}