export function parseRef(ref: string) : { name: string, isK8s: boolean, type: string }
{
    const parts = ref.split('@');
    if (parts.length == 1) {
        return {
            name: ref,
            type: 'kubernetescrd',
            isK8s: true,
        }
    } else if (parts.length == 2) {
        return {
            name: parts[0],
            type: parts[1],
            isK8s: parts[1] === 'kubernetescrd'
        }
    } else {
        return {
            name: ref,
            type: '',
            isK8s: false
        };
    }
}

