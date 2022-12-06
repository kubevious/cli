import * as semver from 'semver';
import VERSION from '../version';

export function checkKubeviousVersion(minVersion: string | undefined,
                                      maxVersion: string | undefined,
                                      range: string | undefined) : boolean
{
    if (minVersion) {
        if (!semver.gte(VERSION, minVersion)) {
            return false;
        }
    }

    if (maxVersion) {
        if (!semver.lte(VERSION, maxVersion)) {
            return false;
        }
    }

    if (range) {
        if (!semver.satisfies(VERSION, range)) {
            return false;
        }
    }

    return true;
}