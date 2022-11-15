import _ from 'the-lodash';

import { logger } from '../../logger';
import { IndexLibraryCommandData, IndexLibraryResult, LibraryRuleRef } from "./types";

import { formatResult as guardFormatResult } from '../guard/format'

export function formatResult({
    manifestPackage,
    guardCommandData,
    rules
    }: IndexLibraryCommandData) : IndexLibraryResult
{

    const guardResult = guardFormatResult(guardCommandData);

    const libraryRules : LibraryRuleRef[] = [];

    for(const rule of rules)
    {
        libraryRules.push({
            kind: rule.id.kind,
            name: rule.id.name!,
            path: rule.source.source.path
        });
    }

    const result: IndexLibraryResult = {
        success: guardResult.success,

        guardResult: guardResult,

        libraryRules: libraryRules,
    }

    return result;
}
