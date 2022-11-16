import _ from 'the-lodash';
import Path from 'path';

export function isWeb(fileOrPath : string)
{
    return _.startsWith(fileOrPath, 'http://') || _.startsWith(fileOrPath, 'https://');
}

export function parent(fileOrUrl: string)
{
    return Path.dirname(fileOrUrl);
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
        return Path.join(parentDir, relative);
    }
}
export function makeRelativePath(fileOrUrl: string, parentDirOrUrl: string)
{
    if (isWeb(fileOrUrl)) {
        return fileOrUrl;
    }

    fileOrUrl = Path.normalize(fileOrUrl);
    parentDirOrUrl = Path.normalize(parentDirOrUrl);

    return Path.relative(parentDirOrUrl, fileOrUrl);
}