import { printSectionTitle, SOURCE_ICONS, print } from "../../screen";
import { KnownK8sVersionsResult } from "./types";

export function output(result: KnownK8sVersionsResult)
{
    printSectionTitle('Known K8s Versions:');
    print();

    for(const version of result.versions)
    {
        print(`${SOURCE_ICONS.k8s.get()}  ${version}`, 2);
    }
}