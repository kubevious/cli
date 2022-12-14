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
    if (parts.length === 0) {
        return {
            isInvalid: true,
            kind: 'file',
            path: '',
            suffixes: []
        }
    }

    let head = _.head(parts) ?? "";
    parts = _.drop(parts);

    let kind : ManifestSourceType = 'file';
    if (head.startsWith("#"))
    {
        head = head.substring(1);
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
        const isWeb = isWebPath(head);
        if (isWeb) {
            kind = 'web';
        }
    }

    return {
        kind: kind,
        path: head,
        suffixes: parts.map(x => parseSuffix(x))
    }
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