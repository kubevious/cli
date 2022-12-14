import _ from 'the-lodash';

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

export interface RuleEngineCounters
{
    rules: {
        total: number,
        failed: number,
        passed: number,
        withErrors: number,
        withWarnings: number
    },
    manifests: {
        total: number,
        processed: number,
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


export function setupBaseObjectSeverity(obj: ResultObject)
{
    obj.severity = makeObjectSeverity('pass', (obj.messages ?? []).map(x => {
        if (x.severity === 'error') {
            return 'fail';
        }
        if (x.severity === 'warning') {
            return 'warning';
        }
        return 'pass';
    }));
}