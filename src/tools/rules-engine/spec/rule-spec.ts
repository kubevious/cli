export type RuleOverrideValues = Record<string, any>;

export interface ClusterRuleK8sSpec
{
    target: string,
    rule: string,
    disabled?: boolean,
    application?: ClusterRuleApplication,
    values?: RuleOverrideValues
}

export interface ClusterRuleApplication {
    useApplicator?: false,
    onlySelectedNamespaces?: false,
    namespaces?: {
        name: string,
        values: RuleOverrideValues
    }[],
}

export interface RuleK8sSpec
{
    target: string,
    rule: string,
    disabled?: boolean,
    values?: RuleOverrideValues
}

export interface RuleApplicatorK8sSpec
{
    clusterRuleRef: {
        name: string
    },
    disabled?: boolean,
    values?: RuleOverrideValues
}