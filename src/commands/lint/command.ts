import _ from 'the-lodash';
import { logger } from '../../logger';

import { K8sApiSchemaFetcher, K8sApiSchemaFetcherResult } from '../../api-schema/k8s-api-schema-fetcher';

import { LintCommandData, LintCommandOptions } from './types';
import { DefaultNamespaceSetter } from '../../processors/default-namespace-setter';
import { K8sClusterConnector } from '../../k8s-connector/k8s-cluster-connector';
import { ManifestLoader } from '../../manifests/manifests-loader';
import { K8sPackageValidator } from '../../validation/k8s-package-validator';
import { ManifestPackage } from '../../manifests/manifest-package';
import { PathResolver } from '../../path-resolver';
import { spinOperation } from '../../screen/spinner';
import { InputSourceExtractor } from '../../input/input-source-extractor';

const myLogger = logger.sublogger('LintCommand');

export async function command(paths: string[], options: LintCommandOptions) : Promise<LintCommandData>
{
    logger.info("[PATH] ", paths);
    logger.info("[OPTIONS] ", options);

    const inputSourceExtractor = new InputSourceExtractor(logger, {
        gitignore: options.gitignore,
        ignorePatterns: options.ignorePatterns
    });
    await inputSourceExtractor.init();

    {
        const sourceExtractorSpinner = spinOperation('Identifying manifest sources...');

        {
            const pathResolver = new PathResolver();
            inputSourceExtractor.addMany([pathResolver.cliCrdsDir]);
        }
    
        inputSourceExtractor.addMany(paths);

        await inputSourceExtractor.extractSources();
        await inputSourceExtractor.reconcile();

        sourceExtractorSpinner.complete('Sources identified.');
    }
    
    const manifestPackage = new ManifestPackage(logger);
    
    const manifestLoader = new ManifestLoader(logger,
                                              manifestPackage,
                                              inputSourceExtractor,
                                              {
                                                  ignoreNonK8s: options.ignoreNonK8s
                                              });

    await manifestLoader.loadFromExtractor();

    if (options.stream) {
        await manifestLoader.loadFromStream();
    }

    manifestPackage.debugOutput();

    let k8sSchemaInfo : K8sApiSchemaFetcherResult | null = null;

    const k8sConnector = new K8sClusterConnector(logger);
    await k8sConnector.setup(options.liveK8s, options.kubeconfig, options.k8sSkipTlsVerify);
    if (k8sConnector.isUsed) {
        if (!k8sConnector.isConnected) {
            console.log('Could not connect to Kubernetes cluster.');
            process.exit(98);
        }
    }

    const k8sApiSchemaFetcher = new K8sApiSchemaFetcher(logger);
    if (options.k8sVersion || !options.liveK8s)
    {
        k8sSchemaInfo = await k8sApiSchemaFetcher.fetchLocal(options.k8sVersion);
    }
    else
    {
        k8sSchemaInfo = await k8sApiSchemaFetcher.fetchRemote(k8sConnector);
    }

    if (!k8sSchemaInfo.success) {
        console.log('Could not fetch Kubernetes API Schema. ');
        console.log(k8sSchemaInfo.error);
        process.exit(98);
    }

    logger.info("Schema Fetch Success: %s", k8sSchemaInfo.success);
    logger.info("TargetK8sVersion: %s", k8sSchemaInfo.targetVersion);
    logger.info("TargetK8sVersion: %s", k8sSchemaInfo.targetVersion);
    logger.info("SelectedK8sVersion: %s", k8sSchemaInfo.selectedVersion);
    logger.info("Found: %s", k8sSchemaInfo.found);
    logger.info("FoundExact: %s", k8sSchemaInfo.foundExact);

    if (!k8sSchemaInfo.k8sJsonSchema)
    {
        console.log('Could not find K8s version: ', k8sSchemaInfo.targetVersion);
        console.log('Select from available versions by running:');
        console.log('$ kubevious list-known-k8s-versions');
        
        process.exit(99);
    }

    const packageValidator = new K8sPackageValidator(logger, k8sSchemaInfo.k8sJsonSchema, manifestPackage, {
        ignoreUnknown: options.ignoreUnknown ? true : false,
        skipApplyCrds: options.skipApplyCrds ? true : false,
    });
    await packageValidator.validate();

    {
        const processor = new DefaultNamespaceSetter(logger, packageValidator.k8sJsonSchema, manifestPackage);
        processor.process();
    }

    manifestPackage.produceNamespaces();

    manifestPackage.debugOutput();

    return {
        k8sConnector,
        manifestPackage,
        k8sSchemaInfo,

        inputSourceExtractor,
        manifestLoader
    } 
}

export function massageLintOptions(options: Partial<LintCommandOptions>) : LintCommandOptions
{
    options = options ?? {};
    
    return {
        k8sVersion: options.k8sVersion,
        ignoreUnknown: options.ignoreUnknown ?? false,
        ignoreNonK8s: options.ignoreNonK8s ?? false,
        stream: options.stream ?? false,
        skipApplyCrds: options.skipApplyCrds ?? false,
        allowDuplicates: options.allowDuplicates ?? false,
    
        liveK8s: options.liveK8s ?? false,
        kubeconfig: options.kubeconfig,
        k8sSkipTlsVerify: options.k8sSkipTlsVerify ?? false,
        gitignore : options.gitignore,
        ignorePatterns: options.ignorePatterns ?? []
    }
}