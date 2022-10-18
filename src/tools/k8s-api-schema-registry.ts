import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import glob from 'glob';
import * as fs from 'fs';
import * as Path from 'path';
import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';
import semver, { SemVer } from 'semver';

export class K8sApiSchemaRegistry
{
    private _logger: ILogger;
    private _versions : Record<string, VersionInfo> = {};

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('K8sApiSchemaRegistry');
        if(!process.env.K8S_API_SCHEMA_DIR) {
            throw new Error(`K8S_API_SCHEMA_DIR not set`);
        }
    }

    init()
    {
        const files = glob.sync(`${process.env.K8S_API_SCHEMA_DIR}/*.json`);
        // this._logger.info("Files: ", files);
        for(const file of files)
        {
            const name = Path.basename(file, '.json');
            const versionInfo : VersionInfo = {
                path: file,
                semver: semver.parse(name)!
            };
            this._versions[versionInfo.semver.version] = versionInfo;
        }
        // this._logger.info("VERSIONS: ", this._versions)
    }

    getVersions() {
        return _.keys(this._versions);
    }

    getVersionSchema(version: string) : K8sApiJsonSchema
    {
        const versionInfo = this._versions[version];
        const contents = fs.readFileSync(versionInfo.path, 'utf8');
        return JSON.parse(contents);
    }

    findLatestVersion()
    {
        const candidates = _.values(this._versions).map(x => x.semver);
        const versionInfo = _.head(
            candidates.sort(semver.rcompare)
        ) ?? null;

        if (versionInfo) {
            return versionInfo.version;
        }
        return null;
    }

    findVersion(targetVersion: string)
    {
        let partsStr = targetVersion.split('.');

        partsStr = partsStr.map(x => x.replace(/\D/g, ''));

        const versionParts = partsStr.map(x => parseInt(x)!);

        // this._logger.info("    target: ", versionParts);

        const result: VersionSearchResult = {
            found: false,
            foundExact: true,
            result: null,
            candidates: []
        }

        let candidates : SemVer[] = _.values(this._versions).map(x => x.semver);
        if (versionParts.length > 0)
        {
            let nextCandidates = candidates.filter(x => x.major === versionParts[0]);
            if (nextCandidates.length > 0)
            {
                candidates = nextCandidates;

                if (versionParts.length > 1)
                {
                    nextCandidates = candidates.filter(x => x.minor === versionParts[1]);
                    if (nextCandidates.length > 0)
                    {
                        candidates = nextCandidates;
                        if (versionParts.length > 2)
                        {
                            nextCandidates = candidates.filter(x => x.patch === versionParts[2]);
                            if (nextCandidates.length > 0)
                            {
                                candidates = nextCandidates;
                            }
                            else
                            {
                                result.foundExact = false;
                            }
                        }
                    }
                    else
                    {
                        result.foundExact = false;
                    }
                }
            }
            else
            {
                result.foundExact = false;
            }
        }

        result.candidates = candidates.map(x => x.version);

        const selectedVersion = _.head(
            candidates.sort(semver.rcompare)
        ) ?? null;
        result.result = selectedVersion ? selectedVersion.version : null;

        result.found = result.result ? true : false;
        if (!result.found) {
            result.foundExact = false;
        }

        return result;
    }
}

interface VersionInfo
{
    path: string;
    semver: SemVer;
}

export interface VersionSearchResult
{
    found: boolean,
    foundExact: boolean,
    result: string | null,
    candidates: string[]
}