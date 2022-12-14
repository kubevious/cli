export interface ToolUsageSample
{
    title: string,
    code: string,
}

export type ToolUsageSamples = ToolUsageSample[];

export function generateUsageSample(samples: ToolUsageSamples): string
{
    const parts = samples.map(x => generateItem(x));

    return parts.join("\n\n");
}

export function generateItem(sample: ToolUsageSample): string
{
    return `👉 ${sample.title}:
    $ ${sample.code}`;
}