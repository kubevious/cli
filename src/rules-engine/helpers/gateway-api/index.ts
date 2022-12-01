
const DICT : {
    [group: string] : {
        [kind: string] : {
            [name: string] : boolean
        }
    }
} = {
    'traefik.containo.us': {
        'TraefikService': {
            'api@internal': true,
            'default@internal': true,
        },
    },
};

export function isInternalService(group: string, kind: string, name: string)
{
    const x = DICT[group];
    if (!x) {
        return false;
    }
    const y = x[kind];
    if (!y) {
        return false;
    }
    const z = y[name];
    if (!z) {
        return false;
    }
    return true;
}

