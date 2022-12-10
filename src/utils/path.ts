import _ from 'the-lodash';
import Path from 'path';

export function isWebPath(fileOrPath : string)
{
    return _.startsWith(fileOrPath, 'http://') || _.startsWith(fileOrPath, 'https://');
}

export function resolvePath(path: string, parentDirOrPath?: string)
{
    if (parentDirOrPath && !isAbsolutePath(path))
    {
        if (isWebPath(parentDirOrPath))
        {
            if (!_.endsWith('/')) {
                parentDirOrPath = `${parentDirOrPath}/`;
            }
            path = `${parentDirOrPath}${path}`;
            return path;
        }
        else
        {
            path = Path.resolve(parentDirOrPath, path);
            return path;
        }
    }

    if (!isWebPath(path))
    {
        path = Path.resolve(path);
    }
    return path;
}

export function isAbsolutePath(fileOrPath : string)
{
    return _.startsWith(fileOrPath, '/') || isWebPath(fileOrPath);
}

export function getParentDir(fileOrUrl: string)
{
    return Path.dirname(fileOrUrl);
}

export function makeRelativePath(fileOrUrl: string, parentDirOrUrl: string)
{
    if (isWebPath(fileOrUrl)) {
        return fileOrUrl;
    }

    fileOrUrl = Path.normalize(fileOrUrl);
    parentDirOrUrl = Path.normalize(parentDirOrUrl);

    return Path.relative(parentDirOrUrl, fileOrUrl);
}