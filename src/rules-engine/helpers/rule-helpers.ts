import { parseImage } from './image';
import { newLabelLookupDict } from './label-lookup';
import { newNameLookupDict } from './name-lookup';
import { labelsToString } from './labels';
import { findDuplicates } from './data-structs';
import { isInternalService } from './gateway-api';
import { parseRef } from './vendor/traefik';

export const RULE_HELPERS = {
    parseImage,
    newLabelLookupDict,
    newNameLookupDict,
    labelsToString,
    findDuplicates,

    gateway: {
        isInternalService: isInternalService
    },

    traefik: {
        parseRef: parseRef
    }
}
