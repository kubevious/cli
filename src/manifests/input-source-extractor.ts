import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise as MyPromise } from 'the-promise';

import { isWebPath } from '../utils/path';
import { OriginalSource } from './original-source';
import { ManifestSourceType } from '../types/manifest';

export class InputSourceExtractor {
    private _logger: ILogger;

    private _originalSources : Record<string, OriginalSource> = {};

    constructor(logger: ILogger) {
        this._logger = logger.sublogger('InputSourcesExtractor');
    }

    public get sources() {
        return _.flatten(this.originalSources.map(x => x.sources));
    }

    public get originalSources() {
        return _.values(this._originalSources);
    }

    public addMany(fileOrPatternOrUrls: string[]) {
        for(const x of fileOrPatternOrUrls)
        {
            this.addSingle(x);
        }
    }

    public addSingle(fileOrPatternOrUrl: string)
    {
        this._logger.info('[addSingle] %s', fileOrPatternOrUrl);

        const isWeb = isWebPath(fileOrPatternOrUrl);
        const kind: ManifestSourceType = isWeb ? "web" : "file";
        const key = _.stableStringify([kind, fileOrPatternOrUrl]);
        if (this._originalSources[key]) {
            return;
        }
        
        const orignalSource = new OriginalSource(kind, fileOrPatternOrUrl);
        this._originalSources[key] = orignalSource;
    }

    public async extractSources()
    {
        await MyPromise.serial(this.originalSources, (x) => MyPromise.resolve(x.extractInputSources()));
    }

    public reconcile() {
        this._logger.info('[reconcile] BEGIN');
        this.debugOutput();

        for(const originalSource of this.originalSources) {
            originalSource.reconcile();
        }

        this._logger.info('[reconcile] END');

        this.debugOutput();
    }

    public debugOutput()
    {
        this._logger.info('[InputSourceExtractor] BEGIN');

        for(const originalSource of this.originalSources)
        {
            originalSource.debugOutput();
        }

        this._logger.info('[InputSourceExtractor] END');
    }

}
