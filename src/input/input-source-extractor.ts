import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { Promise as MyPromise } from 'the-promise';
import * as fs from 'fs';

import { OriginalSource } from '../input/original-source';

export interface InputSourceExtractorOptions
{
    gitignore?: string;
}

export class InputSourceExtractor {
    private _logger: ILogger;
    private _options : InputSourceExtractorOptions;
    
    private ignorePatters: string[] = [];
    private _originalSources : Record<string, OriginalSource> = {};

    constructor(logger: ILogger, options : InputSourceExtractorOptions) {        
        this._logger = logger.sublogger('InputSourcesExtractor');
        this._options = options;
    }

    public async init()
    {
        if (this._options.gitignore)
        {
            await this.loadGitIgnore(this._options.gitignore);
        }
    }

    public get sources() {
        return _.flatten(this.originalSources.map(x => x.sources));
    }

    public get originalSources() {
        return _.values(this._originalSources);
    }

    public addMany(fileOrPatternOrUrls: string[])
    {
        for(const x of fileOrPatternOrUrls)
        {
            this.addSingle(x);
        }
    }

    public addSingle(fileOrPatternOrUrl: string)
    {
        this._logger.info('[addSingle] %s', fileOrPatternOrUrl);

        const key = fileOrPatternOrUrl;
        if (this._originalSources[key]) {
            return;
        }

        const orignalSource = new OriginalSource(fileOrPatternOrUrl, {
            ignorePatters: this.ignorePatters
        });
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

    private async loadGitIgnore(gitIgnorePath: string)
    {
        try
        {
            const contents = await fs.promises.readFile(gitIgnorePath, 'utf8');
            let lines = contents.split('\n');
            lines = lines.map(x => _.trim(x));
            lines = lines.filter(x => x.length > 0);
            lines = lines.filter(x => !_.startsWith(x, '#'));

            this.ignorePatters = lines;
        }
        catch(reason)
        {
            throw new Error(`Failed to load gitignore from ${gitIgnorePath}`);
        }
    }

}
