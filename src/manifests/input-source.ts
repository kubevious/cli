import _ from 'the-lodash';
import * as Path from 'path';

import { isWebPath, resolvePath } from "../utils/path";
import { ManifestSource } from "./k8s-manifest";

export class InputSource {
    private _key: string;
    private _kind: InputSourceKind;
    private _path: string;
    private _file: string;
    private _dir: string;
    private _parentSource?: ManifestSource;
    private _isLoaded = false;

    constructor(path: string, parentSource?: ManifestSource)
    {
        if (parentSource) {
            path = resolvePath(path, parentSource.source.path);
        }

        if (isWebPath(path))
        {
            this._kind = InputSourceKind.web;
        }
        else
        {
            this._kind = InputSourceKind.file;
        }

        this._path = path;
        this._parentSource = parentSource;

        this._key = _.stableStringify([this._kind, this._path]);
        this._file = Path.basename(path);
        this._dir = makeDirStr(Path.dirname(path));
    }

    public get parentSource() {
        return this._parentSource;
    }

    public get key() {
        return this._key;
    }

    public get kind() {
        return this._kind;
    }

    public get path() {
        return this._path;
    }

    public get file() {
        return this._file;
    }

    public get dir() {
        return this._dir;
    }

    public get isLoaded(): boolean {
        return this._isLoaded;
    }
    public set isLoaded(value: boolean) {
        this._isLoaded = value;
    }
}

export enum InputSourceKind {
    file = 'file',
    web = 'web',
}

function makeDirStr(str: string) : string
{
    if ((str.length > 0) && str[str.length - 1] != "/") {
        str += "/";
    }
    return str;
}