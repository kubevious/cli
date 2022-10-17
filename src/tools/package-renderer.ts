import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { ManifestPackage } from './manifest-package';
import Table from 'cli-table';

export class PackageRenderer
{
    private _logger: ILogger;

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('PackageRenderer');
    }

    renderPackageFiles(manifestPackage : ManifestPackage)
    {
        const rows = 
            _.chain(manifestPackage.files)
             .orderBy(x => x.path)
             .map(x => ([x.path, x.contents.length.toString(), x.isValid ? 'OK' : 'Has Errors' ]))
             .value();

        const table = new Table({
            head: ['File', 'Manifests', 'Status'],
            // colWidths: [100, 200]
            rows: rows
        });
        console.log(table.toString());
    }

    renderPackageFileErrors(manifestPackage : ManifestPackage)
    {
        const filesWithErrors = 
            _.chain(manifestPackage.files)
            .filter(x => !x.isValid)
            .orderBy(x => x.path)
            .value();

        const rows : string[][] = [];
        for(const file of filesWithErrors)
        {
            for(const error of file.errors)
            {
                rows.push([file.path, error]);
            }
        }

        const table = new Table({
            head: ['File', 'Error'],
            // colWidths: [100, 200]
            rows: rows
        });
        console.log(table.toString());
    }

    renderPackageManifests(manifestPackage : ManifestPackage)
    {
        const rows =
            _.chain(manifestPackage.manifests)
             .orderBy([x => x.file.path, x => x.namespace, x => x.apiVersion, x => x.kind, x => x.name ])
             .map(x => ([x.file.path, x.namespace ?? '', x.apiVersion, x.kind, x.name ?? '', x.isValid ? 'OK' : 'Has Errors']))
             .value();

        const table = new Table({
            head: ['File', 'Namespace', 'ApiVersion', 'Kind', 'Name', 'Status'],
            // colWidths: [100, 200]
            rows: rows
        });
        console.log(table.toString());
    }

    renderPackageManifestsErrors(manifestPackage : ManifestPackage)
    {
        const manifestsWithErrors =
            _.chain(manifestPackage.manifests)
             .filter(x => !x.isValid) 
             .orderBy([x => x.file.path, x => x.namespace, x => x.apiVersion, x => x.kind, x => x.name ])
             .value();

        const rows : string[][] = [];
        for(const x of manifestsWithErrors)
        {
            for(const error of x.errors)
            {
                rows.push([x.file.path, x.namespace ?? '', x.apiVersion, x.kind, x.name ?? '', error])
            }
        }
   
        const table = new Table({
            head: ['File', 'Namespace', 'ApiVersion', 'Kind', 'Name', 'Error'],
            colWidths: [15, 15, 15, 15, 15, 70],
            rows: rows,

        });
        console.log(table.toString());
    }

}