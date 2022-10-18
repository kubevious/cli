export function parseApiVersion(apiVersion : string) : { group: string, version: string } | null
{
    const parts = apiVersion.split('/');
    if (parts.length === 1) {
        return {
            group: '',
            version: parts[0]
        }
    }
    if (parts.length === 2) {
        return {
            group: parts[0],
            version: parts[1]
        }
    }

    return null;
}