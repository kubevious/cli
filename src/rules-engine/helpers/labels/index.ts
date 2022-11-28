import _ from 'the-lodash';

export function labelsToString(dict?: Record<string, string>) : string
{
    dict = dict || {};
    const parts = _.orderBy(_.keys(dict)).map(x => `${x}=${dict![x]}`);
    return `[${parts.join(', ')}]`;
}