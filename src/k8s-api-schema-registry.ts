import { ILogger } from 'the-logger';
import glob from 'glob';
import * as fs from 'fs';
import * as Path from 'path';
import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';

export class K8sApiSchemaRegistry
{
    private _logger: ILogger;
    private _versions : Record<string, VersionInfo> = {};

    constructor(logger: ILogger)
    {
        this._logger = logger;
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
            this._versions[name] = {
                path: file
            };
        }
        // this._logger.info("VERSIONS: ", this._versions)
    }

    getVersionSchema(version: string) : K8sApiJsonSchema
    {
        const versionInfo = this._versions[version];
        const contents = fs.readFileSync(versionInfo.path, 'utf8');
        return JSON.parse(contents);
    }
}

interface VersionInfo
{
    path: string;
}