import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sObject } from './k8s-types';
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
            head: ['File', 'Config Count', 'Status'],
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

}