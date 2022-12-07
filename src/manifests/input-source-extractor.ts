import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise as MyPromise } from 'the-promise';
import FastGlob from 'fast-glob';
import * as fs from 'fs';
import * as Path from 'path';

import { isWebPath } from '../utils/path';
import { OriginalSource } from './original-source';
import { InputSource } from './input-source';

export class InputSourceExtractor {
    private _logger: ILogger;

    private _originalSources : OriginalSource[] = [];

    private _sources: Record<string, InputSource> = {};
    private _reconcilerDirsToDelete : Record<string, InputSource[]> = {};

    constructor(logger: ILogger) {
        this._logger = logger.sublogger('InputSourcesExtractor');
    }

    public get sources() {
        return _.values(this._sources);
    }

    public async addMany(fileOrPatternOrUrls: string[]) {
        await MyPromise.serial(fileOrPatternOrUrls, (x) => MyPromise.resolve(this.addSingle(x)));
    }

    public async addSingle(fileOrPatternOrUrl: string): Promise<void>
    {
        this._logger.info('[addSingle] %s', fileOrPatternOrUrl);

        const isWeb = isWebPath(fileOrPatternOrUrl);
        const orignalSource = new OriginalSource(isWeb ? "web" : "file", fileOrPatternOrUrl);
        this._originalSources.push(orignalSource);

        if (isWeb) {
            this._registerSource(fileOrPatternOrUrl, orignalSource);
        } else {
            await this._addFromFileOrPattern(fileOrPatternOrUrl, orignalSource);
        }
    }

    public async reconcile() {
        this._logger.info('[reconcile] BEGIN');
        for (const source of _.values(this._sources)) {
            this._logger.info('[reconcile] |> %s', source.key);
        }

        await this._processReconcile();

        this._logger.info('[reconcile] FINAL');
        for (const source of _.values(this._sources)) {
            this._logger.info('[reconcile] |> %s', source.key);
        }

        this._logger.info('[reconcile] END');
    }

    public includeRawSource(source : InputSource)
    {
        this._sources[source.key] = source;
    }

    private async _processReconcile()
    {
        this._reconcilerDirsToDelete = {};

        for (const source of _.values(this._sources))
        {
            if (this._isPreprosessorSource(source))
            {
                this._includePreprocessorSource(source);
            }
        }

        for(const dir of _.keys(this._reconcilerDirsToDelete))
        {
            for(const source of _.values(this._sources))
            {
                if (source.dir.startsWith(dir)) {
                    delete this._sources[source.key];
                }
            }
        }

        for(const source of _.flatten(_.values(this._reconcilerDirsToDelete)))
        {
            this.includeRawSource(source);
        }
    }

    private _isPreprosessorSource(source: InputSource)
    {
        if (source.file === 'kustomization.yaml') {
            return true;
        }
        if (source.file === 'Chart.yaml') {
            return true;
        }
        return false;
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

    private async _addFromFileOrPattern(fileOrPattern: string, originalSource: OriginalSource) {
        // this._logger.info("[_addFromFileOrPattern] fileOrPattern: %s", fileOrPattern);

        const pattern = this._makeSearchPattern(fileOrPattern);
        this._logger.info('[_addFromFileOrPattern] pattern: %s', pattern);
        if (!pattern) {
            return;
        }

        const files = await FastGlob(pattern, {
            onlyFiles: true,
        });
        // this._logger.info("[_addFromFileOrPattern] files: %s", files);

        for (const file of files)
        {
            this._registerSource(file, originalSource);
        }
    }

    private _registerSource(sourcePath: string, originalSource: OriginalSource) {
        // this._logger.info("[_addFromFileOrPattern] sourcePath: %s", sourcePath);

        const source = new InputSource(sourcePath);

        this._logger.verbose('[_addFromFileOrPattern] normalPath: %s', source.path);

        this._sources[source.key] = source;
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
}
