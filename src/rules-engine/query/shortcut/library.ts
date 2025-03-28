import { TARGET_QUERY_BUILDER_OBJ } from "../../query-spec/scope-builder";
import { ShortcutQueryExecutor } from "./shortcut-query-executor";

export function setup(executor: ShortcutQueryExecutor)
{
    const {
        Shortcut,
        ApiVersion,
        Api,
        Union,
        Transform,
        TransformMany,
        Filter,
        First
    } = TARGET_QUERY_BUILDER_OBJ;

    executor.setup('DeploymentPodSpec',
        () =>
            Transform(
                ApiVersion('apps/v1')
                  .Kind("Deployment")
            ).To(item => ({
                synthetic: true,
                apiVersion: 'v1',
                kind: 'PodSpec',
                metadata: {
                    ...item.config.spec?.template?.metadata ?? {},
                    name: `Deployment-${item.name}`,
                    namespace: item.namespace
                },
                spec: item.config.spec?.template?.spec,
                controllerConfig: item.config
            }))
        );

    executor.setup('StatefulSetPodSpec',
        () => 
            Transform(
                ApiVersion('apps/v1')
                    .Kind("StatefulSet")
            ).To(item => ({
                synthetic: true,
                apiVersion: 'v1',
                kind: 'PodSpec',
                metadata: {
                    ...item.config.spec?.template?.metadata ?? {},
                    name: `StatefulSet-${item.name}`,
                    namespace: item.namespace
                },
                spec: item.config.spec?.template?.spec,
                controllerConfig: item.config
            }))
        );

    executor.setup('DaemonSetPodSpec',
        () => 
            Transform(
                ApiVersion('apps/v1')
                    .Kind("DaemonSet")
            ).To(item => ({
                synthetic: true,
                apiVersion: 'v1',
                kind: 'PodSpec',
                metadata: {
                    ...item.config.spec?.template?.metadata ?? {},
                    name: `DaemonSet-${item.name}`,
                    namespace: item.namespace
                },
                spec: item.config.spec?.template?.spec,
                controllerConfig: item.config
            }))
        );

    executor.setup('JobPodSpec',
        () => 
            Transform(
                Filter(
                    Api('batch')
                        .Kind("Job")
                ).Criteria(item => {
                    if (item.config.metadata?.ownerReferences) {
                        return false;
                    }
                    return true;
                })
            ).To(item => ({
                synthetic: true,
                apiVersion: 'v1',
                kind: 'PodSpec',
                metadata: {
                    ...item.config.spec?.template?.metadata ?? {},
                    name: `Job-${item.name}`,
                    namespace: item.namespace
                },
                spec: item.config.spec?.template?.spec,
                controllerConfig: item.config
            }))
        );
    
    executor.setup('CronJobPodSpec',
        () => 
            Transform(
                Api('batch')
                    .Kind("CronJob")
            ).To(item => ({
                synthetic: true,
                apiVersion: 'v1',
                kind: 'PodSpec',
                metadata: {
                    ...item.config.spec?.jobTemplate?.metadata ?? {},
                    name: `CronJob-${item.name}`,
                    namespace: item.namespace
                },
                spec: item.config.spec?.jobTemplate?.spec?.template?.spec,
                controllerConfig: item.config
            }))
        );

    executor.setup('ArgoRolloutPodSpec',
        () => 
            Transform(
                Api('argoproj.io')
                    .Kind("Rollout")
            ).To(item => ({
                synthetic: true,
                apiVersion: 'v1',
                kind: 'PodSpec',
                metadata: {
                    ...item.config.spec?.template?.metadata ?? {},
                    name: `ArgoRollout-${item.name}`,
                    namespace: item.namespace
                },
                spec: item.config.spec?.template?.spec,
                controllerConfig: item.config
            }))
        );        

    executor.setup('PodSpec',
        () => 
            Union(
                Shortcut('DeploymentPodSpec'),
                Shortcut('StatefulSetPodSpec'),
                Shortcut('DaemonSetPodSpec'),
                Shortcut('JobPodSpec'),
                Shortcut('CronJobPodSpec'),
                Shortcut('ArgoRolloutPodSpec'),
            )
        );

    executor.setup('ContainerSpec',
        () => 
            TransformMany(
                Shortcut('PodSpec')
            ).To(item => {
                const results = [];
                for(const cont of item?.config.spec?.containers ?? [])
                {
                    results.push({
                        synthetic: true,
                        apiVersion: 'v1',
                        kind: 'ContainerSpec',
                        metadata: {
                            ...item.config.spec?.template?.metadata ?? {},
                            name: `${item.name}-Cont-${cont.name}`,
                            namespace: item.namespace
                        },
                        spec: cont,
                        isInitContainer: false,
                        podSpec: item?.config.spec,
                        controllerConfig: item.config.controllerConfig
                    });
                }
                for(const cont of item?.config.spec?.initContainers ?? [])
                {
                    results.push({
                        synthetic: true,
                        apiVersion: 'v1',
                        kind: 'ContainerSpec',
                        metadata: {
                            ...item.config.spec?.template?.metadata ?? {},
                            name: `${item.name}-InitCont-${cont.name}`,
                            namespace: item.namespace
                        },
                        spec: cont,
                        isInitContainer: true,
                        podSpec: item?.config.spec,
                        controllerConfig: item.config.controllerConfig
                    });
                }
                return results;
            })
        );        


    executor.setup('Secret',
        (name: string) =>
            First(
                ApiVersion('v1')
                    .Kind("Secret")
                    .name(name),
                Transform(
                    Api('bitnami.com')
                    .Kind("SealedSecret")
                    .name(name)
                ).To(item => ({
                    synthetic: true,
                    apiVersion: 'v1',
                    kind: 'Secret',
                    metadata: item.config.metadata,
                    data: item.config.spec?.encryptedData ?? {}
                }))
            )
    );

}
