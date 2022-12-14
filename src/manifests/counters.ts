import { ManifestPackageCounters, RuleEngineCounters } from "../types/result";
import { logger } from '../logger';
import { ManifestInfoResult, ManifestPackageResult } from "../types/manifest-result";
import { SourceResult } from "../types/source-result";
import { RuleEngineResult, RuleResult } from "../types/rules-result";
import { ManifestPackage } from "./manifest-package";
import { K8sManifest } from "./k8s-manifest";
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

    for(const source of manifestPackageR.rootSource.children ?? [])
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


export function calculateRuleEngineCounters(ruleEngineR: RuleEngineResult, manifestPackage: ManifestPackage) : RuleEngineCounters
{
    const counters : RuleEngineCounters = {
        rules: {
            total: ruleEngineR.rules.length,
            passed: 0,
            failed: 0,
            withErrors: 0,
            withWarnings: 0
        },
        manifests: {
            total: manifestPackage.manifests.length,
            processed: 0,
            passed: 0,
            withErrors: 0,
            withWarnings: 0
        }
    };

    for(const ruleResult of ruleEngineR.rules)
    {
        calculateRuleCounters(ruleResult, counters);
    }

    for(const manifest of manifestPackage.manifests)
    {
        calculateRuleManifestCounters(manifest, counters);
    }
    
    return counters;
}

function calculateRuleCounters(ruleResult: RuleResult, counters: RuleEngineCounters)
{
    if (!ruleResult.compiled)
    {
        counters.rules.failed++;
    }

    if (!ruleResult.compiled) {
        counters.rules.failed++;
    }
    if (ruleResult.passed) {
        counters.rules.passed++;
    }
    if (ruleResult.hasViolationErrors) {
        counters.rules.withErrors++;
    }
    if (ruleResult.hasViolationWarnings) {
        counters.rules.withWarnings++;
    }
}

function calculateRuleManifestCounters(manifest: K8sManifest, counters: RuleEngineCounters)
{
    if (manifest.rules.processed)
    {
        counters.manifests.processed++;
        if (manifest.rules.errors)
        {
            counters.manifests.withErrors++;
        }
        else
        {
            counters.manifests.passed++;
        }

        if (manifest.rules.warnings)
        {
            counters.manifests.withWarnings++;
        }
    }
}