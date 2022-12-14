import _ from 'the-lodash';
import * as Path from 'path';

import { rootLogger } from '../logger';

import { getParentDir, isWebPath, resolvePath } from "../utils/path";
import { OriginalSource } from './original-source';
import { UserPathSuffixes } from './utils';

const logger = rootLogger.sublogger("InputSource");

export class InputSource {
    private _originalSource: OriginalSource;
    private _kind: InputSourceKind;
    private _path: string;
    private _suffixes: UserPathSuffixes;

    private _key: string;
    private _file: string;
    private _dir: string;
    private _isSkipped = false;
    private _isLoaded = false;
    private _preprocessor : string | null = null;

    constructor(originalSource: OriginalSource, kind: InputSourceKind, path: string, suffixes: UserPathSuffixes)
    {
        logger.info("[construct] kind: %s. path: %s. orig: %s", kind, path, originalSource.originalPath);

        this._originalSource = originalSource;
        this._kind = kind;
        this._path = path;
        this._suffixes = suffixes;

        this._key = _.stableStringify([this._kind, this._path]);

        if (kind === InputSourceKind.helm)
        {
            this._file = "";
            this._dir = "";
        }
        else
        {
            this._file = Path.basename(path);
            this._dir = makeDirStr(Path.dirname(path));
        }

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

    public get suffixes() {
        return this._suffixes;
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
        if (this.kind === 'helm') {
            this._preprocessor = 'helm';
            return;
        }

        if (this.file === 'kustomization.yaml') {
            this._preprocessor = 'kustomize';
        } else if (this.file === 'Chart.yaml') {
            this._preprocessor = 'helm';
        }
    }

    public static makeFromPath(originalSource: OriginalSource, path: string) : InputSource
    {
        const parentDir = getParentDir(originalSource.path);
        path = resolvePath(path, parentDir);

        let kind : InputSourceKind = InputSourceKind.file;
        if (isWebPath(path)) {
            kind = InputSourceKind.web;
        }

        return new InputSource(originalSource, kind, path, []);
    }
}

export enum InputSourceKind {
    file = 'file',
    web = 'web',
    helm = 'helm',
}

function makeDirStr(str: string) : string
{
    if ((str.length > 0) && str[str.length - 1] != "/") {
        str += "/";
    }
    return str;
}