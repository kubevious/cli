export function parseImage(fullImage: string) : ImageTag
{
    const tagIndex = fullImage.indexOf(':');
    if (tagIndex === -1) {
        return {
            image: fullImage,
            tag: 'latest'
        }
    } else {
        return {
            image: fullImage.substring(0, tagIndex),
            tag: fullImage.substring(tagIndex + 1)
        }
    }
}

export interface ImageTag
{
    image: string,
    tag: string,
}