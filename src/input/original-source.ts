import _ from "the-lodash";
import { ManifestSourceType } from "../types/manifest";
import { InputSource, InputSourceKind } from "./input-source";

import { logger } from '../logger';
import { ILogger } from "the-logger";

import FastGlob from 'fast-glob';
import * as fs from 'fs';
import * as Path from 'path';
import { parseUserInputPath } from "./utils";

export class OriginalSource
{
    private _kind: ManifestSourceType;
    private _originalPath: string;
    private _path: string;
    private _suffixes: string[];
    private _logger : ILogger = logger.sublogger("OriginalSource");
    private _isExtracted = false;

    private _sources: Record<string, InputSource> = {};
    private _allSources: Record<string, InputSource> = {};
    private _reconcilerDirsToDelete : Record<string, InputSource[]> = {};

    constructor(origPath: string)
    {
        this._originalPath = origPath;

        const parsed = parseUserInputPath(origPath);

        this._kind  = parsed.kind;
        this._path  = parsed.path;
        this._suffixes  = parsed.suffixes;
    }

    get kind() {
        return this._kind;
    }

    get originalPath() {
        return this._originalPath;
    }

    get path() {
        return this._path;
    }

    get suffixes() {
        return this._suffixes;
    }
 
    get sources() {
        return _.values(this._sources);
    }

    get hasAnyInput() {
        return _.keys(this._allSources).length > 0;
    }

    public async extractInputSources()
    {
        if (this._isExtracted) {
            return;
        }
        this._isExtracted = true;

        if (this.kind === 'file')
        {
            await this._addFromFileOrPattern();
        }
        else if (this.kind === 'web')
        {
            InputSource.makeFromPath(this, this.path);
        }
        else if (this.kind === 'helm')
        {
            new InputSource(this, InputSourceKind.helm, this.path, this.suffixes);
        }
    }
    
    public reconcile()
    {
        this._reconcilerDirsToDelete = {};

        for (const source of _.values(this._sources))
        {
            source.checkPreprocessor();
            if (source.isPreprocessor) {
                this._includePreprocessorSource(source);
            }
        }

        for(const dir of _.keys(this._reconcilerDirsToDelete))
        {
            for(const source of _.values(this._sources))
            {
                if (source.dir.startsWith(dir)) {
                    source.isSkipped = true;
                    delete this._sources[source.key];
                }
            }
        }

        for(const source of _.flatten(_.values(this._reconcilerDirsToDelete)))
        {
            this.includeRawSource(source);
        }
    }

    private async _addFromFileOrPattern() {
        // this._logger.info("[_addFromFileOrPattern] fileOrPattern: %s", fileOrPattern);

        const pattern = this._makeSearchPattern(this.path);
        this._logger.info('[_addFromFileOrPattern] pattern: %s', pattern);
        if (!pattern) {
            return;
        }

        const files = await FastGlob(pattern, {
            onlyFiles: true,
            absolute: true
        });
        // this._logger.info("[_addFromFileOrPattern] files: %s", files);

        for (const file of files)
        {
            InputSource.makeFromPath(this, file);
        }
    }

    private _includePreprocessorSource(source: InputSource)
    {
        for(const parentDir of _.keys(this._reconcilerDirsToDelete))
        {
            if (source.dir.startsWith(parentDir)) {
                return;
            }
            if (parentDir.startsWith(source.dir)) {
                delete this._reconcilerDirsToDelete[parentDir];
            }
        }

        if (!this._reconcilerDirsToDelete[source.dir]) {
            this._reconcilerDirsToDelete[source.dir] = [];
        }
        this._reconcilerDirsToDelete[source.dir].push(source);
        return true;
    }

    private _makeSearchPattern(fileOrPattern: string): string | null {
        if (fs.existsSync(fileOrPattern)) {
            const stats = fs.statSync(fileOrPattern);
            if (stats.isDirectory()) {
                return Path.join(fileOrPattern, '**/*.{yaml,yml}');
            }

            if (stats.isFile()) {
                return fileOrPattern;
            }
        } else {
            return fileOrPattern;
        }

        return null;
    }

    public includeRawSource(source : InputSource)
    {
        source.isSkipped = false;
        this._sources[source.key] = source;
        this._allSources[source.key] = source;
    }

    public debugOutput()
    {
        this._logger.info('[OrigSource] => %s :: %s', this.kind, this.path);
        if (this.suffixes)
        {
            this._logger.info('              > SUFFIXES: %s', this.suffixes);
        }

        for (const source of _.values(this._allSources))
        {
            if (source.isSkipped) {
                this._logger.info('              > %s [SKIPPED]', source.key);
            } else {
                this._logger.info('              > %s', source.key);
            }
        }
    }
}