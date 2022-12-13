import { ManifestPackageCounters, RuleEngineCounters } from "../types/result";
import { logger } from '../logger';
import { ManifestInfoResult, ManifestPackageResult } from "../types/manifest-result";
import { SourceResult } from "../types/source-result";
import { RuleEngineResult } from "../types/rules-result";
const myLogger = logger.sublogger('Counters');

export function calculateManifestPackageCounters(manifestPackageR: ManifestPackageResult) : ManifestPackageCounters
{
    const counters : ManifestPackageCounters = {
        sources: {
            total: 0,
            withErrors: 0,
            withWarnings: 0
        },
        manifests: {
            total: 0,
            passed: 0,
            withErrors: 0,
            withWarnings: 0
        }
    };

    for(const source of manifestPackageR.sources)
    {
        calculateSourceCounters(source, counters);
    }
    
    return counters;
}

function calculateSourceCounters(source: SourceResult, counters: ManifestPackageCounters)
{
    counters.sources.total++;
    if (source.severity === 'fail') {
        counters.sources.withErrors++;
    } else if (source.severity === 'warning') {
        counters.sources.withWarnings++;
    }
    
    for(const manifest of source.manifests ?? [])
    {
        calculateManifestCounters(manifest, counters);
    }

    for(const childSource of source.children ?? [])
    {
        calculateSourceCounters(childSource, counters);
    }
}

function calculateManifestCounters(manifest: ManifestInfoResult, counters: ManifestPackageCounters)
{
    myLogger.info("[calculateManifestCounters] %s", manifest.name);
    counters.manifests.total++;

    if (manifest.severity === 'fail') {
        counters.manifests.withErrors++;
    } else if (manifest.severity === 'warning') {
        counters.manifests.withWarnings++;
    } else {
        counters.manifests.passed++;
    }
}



export function calculateRuleEngineCounters(ruleEngineR: RuleEngineResult) : RuleEngineCounters
{
    const counters : RuleEngineCounters = {
        rules: {
            total: 0,
            passed: 0,
            failed: 0,
            withErrors: 0,
            withWarnings: 0
        },
        manifests: {
            total: 0,
            processed: 0,
            passed: 0,
            withErrors: 0,
            withWarnings: 0
        }
    };

    // TODO: Implement this!!!
    
    return counters;
}