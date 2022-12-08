import _ from 'the-lodash';
import * as Path from 'path';

import { isWebPath, resolvePath } from "../utils/path";
import { OriginalSource } from './original-source';

export class InputSource {
    private _key: string;
    private _kind: InputSourceKind;
    private _path: string;
    private _file: string;
    private _dir: string;
    private _originalSource: OriginalSource;
    private _isSkipped = false;
    private _isLoaded = false;
    private _preprocessor : string | null = null;

    constructor(path: string, originalSource: OriginalSource)
    {
        path = resolvePath(path, originalSource.path);

        if (isWebPath(path))
        {
            this._kind = InputSourceKind.web;
        }
        else
        {
            this._kind = InputSourceKind.file;
        }

        this._path = path;
        this._originalSource = originalSource;

        this._key = _.stableStringify([this._kind, this._path]);
        this._file = Path.basename(path);
        this._dir = makeDirStr(Path.dirname(path));

        // this._logger.verbose('[InputSource] normalPath: %s', this.path);

        originalSource.includeRawSource(this);
    }

    public get originalSource() {
        return this._originalSource;
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

    public get isSkipped() {
        return this._isSkipped;
    }
    public set isSkipped(value: boolean) {
        this._isSkipped = value;
    }

    get preprocessor() {
        return this._preprocessor;
    }

    get isPreprocessor() {
        return _.isNotNullOrUndefined(this._preprocessor);
    }

    public checkPreprocessor()
    {
        if (this.file === 'kustomization.yaml') {
            this._preprocessor = 'kustomize';
        } else if (this.file === 'Chart.yaml') {
            this._preprocessor = 'helm';
        }
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