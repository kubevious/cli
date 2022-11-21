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
        Filter
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
                    name: `Deployment-${item.config.metadata?.name}`
                },
                spec: item.config.spec?.template?.spec
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
                    name: `StatefulSet-${item.config.metadata?.name}`
                },
                spec: item.config.spec?.template?.spec
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
                    name: `DaemonSet-${item.config.metadata?.name}`
                },
                spec: item.config.spec?.template?.spec
            }))
        );

    executor.setup('JobPodSpec',
        () => 
            Transform(
                Filter(
                    ApiVersion('batch/v1')
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
                    name: `Job-${item.config.metadata?.name}`
                },
                spec: item.config.spec?.template?.spec
            }))
        );
    
    executor.setup('CronJobPodSpec',
        () => 
            Transform(
                ApiVersion('batch/v1')
                    .Kind("CronJob")
            ).To(item => ({
                synthetic: true,
                apiVersion: 'v1',
                kind: 'PodSpec',
                metadata: {
                    ...item.config.spec?.template?.metadata ?? {},
                    name: `CronJob-${item.config.metadata?.name}`
                },
                spec: item.config.spec?.jobTemplate?.spec?.template?.spec
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
                            name: `${item.config.metadata?.name}-Cont-${cont.name}`
                        },
                        spec: cont
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
                            name: `${item.config.metadata?.name}-InitCont-${cont.name}`
                        },
                        spec: cont
                    });
                }
                return results;
            })
        );        

}