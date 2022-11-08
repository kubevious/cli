import _ from 'the-lodash';
import { logger } from '../../logger';

import { ManifetsLoader } from '../../tools/manifests-loader'
import { K8sPackageValidator } from '../../tools/k8s-package-validator';
import { K8sApiSchemaFetcher, K8sApiSchemaFetcherResult } from '../../tools/k8s-api-schema-fetcher';

import { LintCommandData } from './types';
import { DefaultNamespaceSetter } from '../../tools/default-namespace-setter';

export async function command(path: string[], options: any) : Promise<LintCommandData>
{
    logger.info("[PATH] ", path);

    const loader = new ManifetsLoader(logger);
    const manifestPackage = await loader.load(path);

    let k8sSchemaInfo : K8sApiSchemaFetcherResult | null = null;

    const k8sApiSchemaFetcher = new K8sApiSchemaFetcher(logger);
    if (options.liveK8s) {
        k8sSchemaInfo = await k8sApiSchemaFetcher.fetchRemote(options.kubeconfig);
    } else {
        k8sSchemaInfo = await k8sApiSchemaFetcher.fetchLocal(options.k8sVersion);
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

    return {
        manifestPackage,
        k8sSchemaInfo
    } 
}