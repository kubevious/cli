import _ from 'the-lodash';
import Path from 'path';

export function isWebPath(fileOrPath : string)
{
    return _.startsWith(fileOrPath, 'http://') || _.startsWith(fileOrPath, 'https://');
}

export function resolvePath(path: string, parentFileOrUrl?: string)
{
    if (parentFileOrUrl && !isAbsolutePath(path))
    {
        let parentPath = parent(parentFileOrUrl);
        if (isWebPath(parentPath))
        {
            if (!_.endsWith('/')) {
                parentPath = `${parentPath}/`;
            }
            path = `${parentPath}${path}`;
            return path;
        }
        else
        {
            path = Path.resolve(parentPath, path);
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

export function parent(fileOrUrl: string)
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