import _ from 'the-lodash';
import { ManifestSourceType } from "../types/manifest";
import { isWebPath } from '../utils/path';

export interface UserPathSuffix
{
    key: string,
    value: string,
}

export type UserPathSuffixes = UserPathSuffix[];

export interface ParsedUserPath {
    kind: ManifestSourceType,
    path: string,
    suffixes: UserPathSuffixes,
    isInvalid?: boolean,
}

export function parseUserInputPath(str: string) : ParsedUserPath
{
    let parts = str.split("@");

    let head : string = '';
    let kind : ManifestSourceType = 'file';

    if (_.startsWith(str, '@'))
    {
        parts = _.drop(parts);

        head = _.head(parts) ?? '';
        parts = _.drop(parts);

        kind = head as ManifestSourceType;

        if (kind !== 'helm') {
            return {
                isInvalid: true,
                kind: 'file',
                path: str,
                suffixes: []
            }
        }

        head = _.head(parts) ?? "";
        parts = _.drop(parts);

    }
    else
    {
        head = _.head(parts) ?? "";
        parts = _.drop(parts);

        const isWeb = isWebPath(head);
        if (isWeb) {
            kind = 'web';
        }
    }

    if (!head) {
        return {
            isInvalid: true,
            kind: kind,
            path: '',
            suffixes: []
        }
    }

    const result = {
        kind: kind,
        path: head,
        suffixes: parts.map(x => parseSuffix(x))
    }

    return result;
}

function parseSuffix(str: string) : UserPathSuffix
{
    const index = str.indexOf("=");
    if (index === -1) {
        return {
            key: '',
            value: str
        }
    } else {
        return {
            key: str.substring(0, index),
            value: str.substring(index + 1)
        }
    }

}