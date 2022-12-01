import _ from 'the-lodash';

export function findDuplicates<T>(items: T[], selector?: (item: T) => string) : string[]
{
    if (!items) {
        return [];
    }
    
    let list : any[] = items;
    list = list.filter(x => x);

    if (selector) {
        list = items.map(selector);
    }

    const dict: Record<string, boolean> = {};
    const duplicates: Record<string, boolean> = {};

    for(const x of list)
    {
        const key = x.toString();
        if (dict[key]) {
            duplicates[key] = true;
        } else {
            dict[key] = true;
        }
    }

    return _.keys(duplicates);
}
