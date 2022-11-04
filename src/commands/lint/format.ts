import _ from 'the-lodash';

import { LintManifestsResult, LintSeverity, LintSourceResult } from "./types";
import { logger } from '../../logger';
import { ManifestPackage } from '../../tools/manifest-package';
import { K8sApiSchemaFetcherResult } from '../../tools/k8s-api-schema-fetcher';
import { ErrorStatus } from '../../types/manifest';

export function formatResult(
    manifestPackage: ManifestPackage,
    schemaInfo: K8sApiSchemaFetcherResult,
    ) : LintManifestsResult
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
            severity: decideSeverity(source, source.contents),
            errors: source.errors,
            warnings: source.warnings,
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
                severity: decideSeverity(manifest),
                errors: manifest.errors,
                warnings: manifest.warnings,
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

function decideSeverity(myStatus: ErrorStatus, children?: ErrorStatus[]) : LintSeverity
{
    children = children || [];

    if (!myStatus.success) {
        return 'fail';
    }
    for(const child of children) {
        if (!child.success) {
            return 'fail';
        }
    }

    if (myStatus.warnings && myStatus.warnings.length > 0) {
        return 'warning';
    }
    for(const child of children) {
        if (child.warnings && child.warnings.length > 0) {
            return 'warning';
        }
    }

    return 'pass';
}