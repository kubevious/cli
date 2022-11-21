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
                metadata: item.config.spec?.template?.metadata,
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
                metadata: item.config.spec?.template?.metadata,
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
                metadata: item.config.spec?.template?.metadata,
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
                metadata: item.config.spec?.jobTemplate?.spec?.template?.metadata,
                spec: item.config.spec?.jobTemplate?.spec?.template?.spec
            }))
        );

    executor.setup('PodSpec',
        () => 
            Union(
                Shortcut('DeploymentPodSpec'),
                Shortcut('StatefulSetPodSpec'),
                Shortcut('JobPodSpec'),
                Shortcut('CronJobPodSpec'),
            )
        );

}