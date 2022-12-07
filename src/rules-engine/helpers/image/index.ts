import _ from 'the-lodash';

export function parseImage(fullImage: string) : ImageTag
{
    if (!fullImage) {
        return {
            isInvalid: true,
            registry: '',
            repository: fullImage,
            namespace: '',
            name: fullImage,
            tag: 'latest',
        }
    }

    let parts = fullImage.split('/');
    if (parts.length === 0) {
        return {
            isInvalid: true,
            registry: '',
            repository: fullImage,
            namespace: '',
            name: fullImage,
            tag: 'latest',
        }
    }

    const tagInfo = parseTag(_.last(parts)!);

    parts = _.dropRight(parts);
    parts.push(tagInfo.name);

    let registry = 'docker.io';
    if (hasRegistry(parts)) {
        registry = _.head(parts)!;
        parts = _.drop(parts);
    }

    let namespace = '';
    if (parts.length >= 2) {
        namespace = _.dropRight(parts).join('/');
    }

    const repository = parts.join('/');

    const result : ImageTag = {
        registry: registry,
        repository: repository,
        namespace: namespace,
        name: _.last(parts) ?? '',
        tag: tagInfo.tag
    }

    return result
}

function parseTag(str: string) : { name: string, tag: string }
{
    const index = str.lastIndexOf(':');
    if (index === -1) {
        return {
            name: str,
            tag: 'latest'
        }
    } else {
        return {
            name: str.substring(0, index),
            tag: str.substring(index + 1),
        }
    }
}

function hasRegistry(parts: string[])
{
    if (parts.length >= 3) {
        return true;
    }

    return false;
}

export interface ImageTag
{
    isInvalid?: boolean,
    registry: string,
    repository: string,
    namespace: string,
    name: string,
    tag: string,
}