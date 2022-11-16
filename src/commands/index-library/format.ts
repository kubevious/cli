import _ from 'the-lodash';

import { logger } from '../../logger';
import { IndexLibraryCommandData, IndexLibraryResult } from "./types";

import { formatResult as guardFormatResult } from '../guard/format'

export function formatResult({
    manifestPackage,
    guardCommandData,
    rules,
    libraryPath,
    libraryObject
    }: IndexLibraryCommandData) : IndexLibraryResult
{

    const guardResult = guardFormatResult(guardCommandData);

    const result: IndexLibraryResult = {
        success: guardResult.success,

        guardResult: guardResult,

        libraryPath: libraryPath,
        libraryRules: libraryObject.spec.rules,
    }

    return result;
}
