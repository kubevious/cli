import { ManifestSourceType } from "../types/manifest";
import { InputSource } from "./input-source";

import { logger } from '../logger';
import { ILogger } from "the-logger/dist";
import _ from "lodash";
export class OriginalSource
{
    public kind: ManifestSourceType;
    public path: string;
    private _logger : ILogger = logger.sublogger("OriginalSource");

    private _sources: Record<string, InputSource> = {};
    private _allSources: Record<string, InputSource> = {};
    private _reconcilerDirsToDelete : Record<string, InputSource[]> = {};

    constructor(kind: ManifestSourceType, path: string)
    {
        this.kind = kind;
        this.path = path;
    }
 
    get sources() {
        return _.values(this._sources);
    }

    get hasAnyInput() {
        return _.keys(this._allSources).length > 0;
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

    public includeRawSource(source : InputSource)
    {
        source.isSkipped = false;
        this._sources[source.key] = source;
        this._allSources[source.key] = source;
    }

    public debugOutput()
    {
        this._logger.info('[OrigSource] => %s :: %s', this.kind, this.path);
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