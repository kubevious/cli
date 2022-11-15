import _ from 'the-lodash';
import path from 'path';

export function isWeb(fileOrPath : string)
{
    return _.startsWith(fileOrPath, 'http://') || _.startsWith(fileOrPath, 'https://');
}

export function parent(fileOrUrl: string)
{
    return path.dirname(fileOrUrl);
}

export function joinPath(parentFileOrUrl: string, relative: string)
{
    const parentDir = parent(parentFileOrUrl);
    if (isWeb(parentDir)) {
        if (_.endsWith('/')) {
            return `${parentDir}${relative}`;
         } else {
            return `${parentDir}/${relative}`;
         }
    } else {
        return path.join(parentDir, relative);
    }
}