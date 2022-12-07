import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { ManifestPackage } from '../manifests/manifest-package';
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
            _.chain(manifestPackage.sources)
             .orderBy(x => x.id.path)
             .map(x => ([x.id.path, x.manifests.length.toString(), x.success ? 'OK' : 'Has Errors' ]))
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
            _.chain(manifestPackage.sources)
            .filter(x => !x.success)
            .orderBy(x => x.id.path)
            .value();

        const rows : string[][] = [];
        for(const file of filesWithErrors)
        {
            for(const error of file.errors)
            {
                rows.push([file.id.path, error]);
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
             .orderBy([x => x.source.id.path, x => x.id.namespace, x => x.id.apiVersion, x => x.id.kind, x => x.id.name ])
             .map(x => ([x.source.id.path, x.id.namespace ?? '', x.id.apiVersion, x.id.kind, x.id.name ?? '', x.success ? 'OK' : 'Has Errors']))
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
             .filter(x => !x.success) 
             .orderBy([x => x.source.id.path, x => x.id.namespace, x => x.id.apiVersion, x => x.id.kind, x => x.id.name ])
             .value();

        const rows : string[][] = [];
        for(const x of manifestsWithErrors)
        {
            for(const error of x.errors)
            {
                rows.push([x.source.id.path, x.id.namespace ?? '', x.id.apiVersion, x.id.kind, x.id.name ?? '', error])
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