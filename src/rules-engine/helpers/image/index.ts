export function parseImage(fullImage: string) : ImageTag
{
    const match = fullImage.match(/^(?:([^/]+)\/)?(?:([^/]+)\/)?([^@:/]+)(?:[@:](.+))?$/);
    if (!match) {
        return {
            isInvalid: true,
            registry: '',
            namespace: '',
            name: fullImage,
            repository: fullImage,
            image: fullImage,
            tag: 'latest',
        }
    }

    let registry : string | undefined = match[1];
    let namespace = match[2]
    const name = match[3]
    const tag = match[4] || 'latest';

    if (!namespace && registry && !/[:.]/.test(registry)) {
        namespace = registry
        registry = undefined
    }

    registry = registry || 'docker.io'

    const repository = [namespace, name].filter(x => x).join('/');

    const result : ImageTag = {
        registry: registry,
        namespace: namespace,
        name: name,
        repository: repository,
        image: repository,
        tag: tag
    }

    return result
}

export interface ImageTag
{
    isInvalid?: boolean,
    registry: string,
    namespace?: string | undefined,
    name: string,
    repository: string,
    image: string,
    tag: string,
}