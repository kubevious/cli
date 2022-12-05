import _ from 'the-lodash';

export function sanitizeYaml(obj: any) : any
{
    if (_.isArray(obj)) {
        return obj.map(x => sanitizeYaml(x));
    }
    
    if (_.isPlainObject(obj)) {
        for(const key of _.keys(obj))
        {
            obj[key] = sanitizeYaml(obj[key]);
        }
    }

    if (_.isNull(obj)) {
        return undefined;
    }

    return obj;
}
