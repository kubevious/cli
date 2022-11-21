import _ from 'the-lodash';

export class RuleHelpers
{
    parseImage(fullImage: string) : ImageTag
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
}

export const RULE_HELPERS = new RuleHelpers();

export interface ImageTag
{
    image: string,
    tag: string,
}