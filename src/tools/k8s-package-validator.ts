import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';

import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';

import { K8sManifest, ManifestPackage } from './manifest-package';
import { K8sManifestValidator } from './k8s-manifest-validator';
import { ISpinner, spinOperation } from '../utils/screen';

export interface K8sPackageValidatorParams
{
    ignoreUnknown? : boolean;
}

export class K8sPackageValidator
{
    private _logger: ILogger;
    private _k8sJsonSchema : K8sApiJsonSchema;
    private _params: K8sPackageValidatorParams;
    private _spinner? : ISpinner;

    constructor(logger: ILogger, k8sJsonSchema : K8sApiJsonSchema, params?: K8sPackageValidatorParams)
    {
        this._logger = logger.sublogger('K8sPackageValidator');
        this._k8sJsonSchema = k8sJsonSchema;
        this._params = params || {};
    }

    validate(manifestPackage : ManifestPackage)
    {
        this._spinner = spinOperation('Validating manifests...');

        return Promise.serial(manifestPackage.manifests, x => this._validateManifest(manifestPackage, x))
            .then(() => {
                this._spinner!.complete('Validation complete.')
            });
    }

    private _validateManifest(manifestPackage : ManifestPackage, manifest: K8sManifest)
    {
        if (!manifest.source.success)
        {
            return;
        }

        this._spinner!.update(`Validating ${manifest.source.source.path}...`);

        try
        {
            const validator = new K8sManifestValidator(this._logger, this._k8sJsonSchema, this._params);
            const result = validator.validate(manifest.config);
            if (!result.success)
            {
                this._logger.verbose("ERRORS: ", result.errors!);

                manifestPackage.manifestErrors(manifest, result.errors!);
            }
            manifestPackage.manifestWarnings(manifest, result.warnings);
        }
        catch(reason: any)
        {
            this._logger.error("[validate] ERROR: ", reason);

            manifestPackage.sourceError(manifest.source, `Unknown error occured. ${reason?.message}`);
        }
    }
}
