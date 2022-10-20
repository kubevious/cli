import Path from 'path';

export class PathResolver
{

    get distDir() {
        return __dirname;
    }

    get rootDir() {
        return Path.resolve(this.distDir, '..')
    }

    get assetsDir() {
        return Path.resolve(this.rootDir, 'assets')
    }

    get k8sApiSchemaDir() {
        if(process.env.K8S_API_SCHEMA_DIR) {
            return process.env.K8S_API_SCHEMA_DIR;
        } else {
            return Path.join(this.assetsDir, 'k8s-api-json-schema');
        }
    }
    
}