import { ManifestSourceId } from "./manifest";

export enum RuleKind {
    ClusterRule = 'ClusterRule',
    Rule = 'Rule',
}
export interface RuleObject {
    source: ManifestSourceId,
    kind: RuleKind;
    namespace?: string;
    name: string;
    application?: RuleApplicationScope; 
    target: string;
    script: string;
    values: Record<string, any>;
}

export interface RuleApplicationScope {
    namespace?: string;
}