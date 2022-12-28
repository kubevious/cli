import * as semver from 'semver';
import VERSION from '../version';

export function checkKubeviousVersion(minVersion: string | undefined,
                                      maxVersion: string | undefined,
                                      range: string | undefined) : string[]
{
    const issues : string[] = [];

    if (minVersion) {
        if (!semver.gte(VERSION, minVersion)) {
            issues.push(`Try installing Kubevious CLI version ${minVersion} or higher.`);
        }
    }

    if (maxVersion) {
        if (!semver.lte(VERSION, maxVersion)) {
            issues.push(`Try installing Kubevious CLI version ${maxVersion} or lower.`);
        }
    }

    if (range) {
        if (!semver.satisfies(VERSION, range)) {
            issues.push(`Try installing Kubevious CLI version ${range}.`);
        }
    }

    return issues;
}