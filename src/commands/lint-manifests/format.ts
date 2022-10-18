import _ from 'the-lodash';

import { LintManifestsResult, LintSourceResult } from "./types";
import { logger } from '../../logger';
import { ManifestPackage } from '../../tools/manifest-package';
import { K8sApiSchemaFetcherResult } from '../../tools/k8s-api-schema-fetcher';

export function formatResult(manifestPackage: ManifestPackage, schemaInfo: K8sApiSchemaFetcherResult) : LintManifestsResult
{
    const result: LintManifestsResult = {
        success: true,
        sources: [],

        targetK8sVersion: schemaInfo.targetVersion || undefined,
        selectedK8sVersion: schemaInfo.selectedVersion || undefined,
        foundK8sVersion: schemaInfo.found,
        foundExactK8sVersion: schemaInfo.foundExact
    };

    for(const source of manifestPackage.sources)
    {
        const outputSource : LintSourceResult = {
            kind: source.source.kind,
            path: source.source.path,
            manifestCount: source.contents.length,
            success: source.success,
            errors: source.errors,
            manifests: []
        };

        result.sources.push(outputSource);

        if (!source.success) {
            outputSource.success = false;
            result.success = false;
        }

        for(const manifest of source.contents)
        {
            outputSource.manifests.push({
                apiVersion: manifest.id.apiVersion,
                api: manifest.id.api,
                version: manifest.id.version,
                kind: manifest.id.kind,
                namespace: manifest.id.namespace,
                name: manifest.id.name,
            
                success: manifest.success,
                errors: manifest.errors,
            });

            if (!manifest.success) {
                outputSource.success = false;
                result.success = false;
            }
        }

        outputSource.manifests = 
            _.chain(outputSource.manifests)
            .orderBy([x => x.namespace, x => x.api, x => x.version, x => x.kind, x => x.name])
            .value();
    }

    result.sources = 
        _.chain(result.sources)
         .orderBy([x => x.kind, x => x.path])
         .value();
    
    return result;
}