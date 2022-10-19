import _ from 'the-lodash';
import { ILogger } from 'the-logger';

import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';

import { ManifestPackage } from './manifest-package';
import { K8sManifestValidator } from './k8s-manifest-validator';

export interface K8sPackageValidatorParams
{
    ignoreUnknown? : boolean;
}

export class K8sPackageValidator
{
    private _logger: ILogger;
    private _k8sJsonSchema : K8sApiJsonSchema;
    private _params: K8sPackageValidatorParams;

    constructor(logger: ILogger, k8sJsonSchema : K8sApiJsonSchema, params?: K8sPackageValidatorParams)
    {
        this._logger = logger.sublogger('K8sPackageValidator');
        this._k8sJsonSchema = k8sJsonSchema;
        this._params = params || {};
    }

    validate(manifestPackage : ManifestPackage)
    {
        for(const manifest of manifestPackage.manifests)
        {
            if (manifest.source.success)
            {
                this._logger.verbose("FILE: %s", manifest.source.source.path);

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
    }
}
