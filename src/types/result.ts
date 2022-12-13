import _ from 'the-lodash';
import { K8sObjectId } from "./k8s";
import { ManifestSourceType } from "./manifest";

export type ResultObjectSeverity = 'pass' | 'fail' | 'warning';
export type ResultMessageSeverity = 'error' | 'warning';

export interface ResultMessage
{
    severity: ResultMessageSeverity;
    msg: string;
}

export interface ResultObject
{
    severity: ResultObjectSeverity;
    messages?: ResultMessage[];
}

export interface ManifestInfoResult extends K8sObjectId, ResultObject
{
}

export interface SourceInfoResult extends ResultObject
{
    kind: ManifestSourceType;
    path: string;
}

export interface ManifestResult extends ManifestInfoResult
{
    sources: SourceInfoResult[];
}

export interface SourceResult extends SourceInfoResult
{
    children?: SourceResult[];
    manifests?: ManifestInfoResult[];
}

export interface ManifestPackageResult extends ResultObject
{
    manifests: ManifestResult[];
    sources: SourceResult[];
}

export interface ManifestPackageCounters
{
    sources: {
        total: number,
        withErrors: number,
        withWarnings: number
    },
    manifests: {
        total: number,
        passed: number,
        withErrors: number,
        withWarnings: number
    }
}

export function makeObjectSeverity(severity: ResultObjectSeverity, others: ResultObjectSeverity[]) : ResultObjectSeverity
{
    const items = _.flatten([[severity], others]);
    const dict = _.makeBoolDict(items);
    if (dict['fail']) {
        return 'fail';
    }
    if (dict['warning']) {
        return 'warning';
    }
    return 'pass';
}

export function makeObjectSeverityFromChildren(severity: ResultObjectSeverity, children: ResultObject[]) : ResultObjectSeverity
{
    return makeObjectSeverity(severity, children.map(x => x.severity));
}