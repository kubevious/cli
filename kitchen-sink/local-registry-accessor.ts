import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { RegistryAccessor, SnapshotNodeConfig, SnapshotPropsConfig, ItemProperties } from '@kubevious/state-registry';
import { PropsId, NodeKind, parentDn, parseDn, sanitizeDnPath } from '@kubevious/entity-meta';
import { EnumDictionary } from '@kubevious/entity-meta';

export class LocalRegistryAccessor implements RegistryAccessor
{
    private _logger: ILogger;

    private _nodeMap : Record<string, SnapshotNodeConfig> = {};
    private _childrenMap : Record<string, string[]> = {};
    private _propertiesMap : Record<string, ItemProperties> = {};
    private _kindMap : EnumDictionary<NodeKind, Record<string, SnapshotNodeConfig>> = {};

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('LocalRegistryAccessor');
    }

    getNode(dn: string): SnapshotNodeConfig | null
    {
        return this._nodeMap[dn] ?? null;
    }

    getAllProperties(dn: string) : ItemProperties
    {
        const allProps = this._getProperties(dn) ?? {};
        return allProps;
    }

    getProperties(dn: string, id: PropsId) : SnapshotPropsConfig
    {
        const allProps = this._getProperties(dn) ?? {};
        const props = allProps[id] ?? {};
        return props || {};
    }

    childrenByKind(parentDn: string, kind: NodeKind): string[]
    {
        const newResult : Record<string, boolean> = {};
        const childDns = this._childrenMap[parentDn];
        if (childDns) {
            for(const childDn of childDns) {
                const childNode = this.getNode(childDn);
                if (childNode) {
                    if (childNode.kind == kind)
                    {
                        newResult[childDn] = true;
                    }
                }
            }
        }
        return _.keys(newResult);
    }

    findByKind(kind: NodeKind) : Record<string, SnapshotNodeConfig>
    {
        const res = this._kindMap[kind];
        if (!res) {
            return {}
        }
        return res;
    }

    scopeByKind(ancestorDn: string, kind: NodeKind): string[]
    {
        const result = this.findByKind(kind);
        const newResult : Record<string, boolean> = {};
        for(const key of _.keys(result))
        {
            if (_.startsWith(key, ancestorDn))
            {
                newResult[key] = true;
            }
        }
        return _.keys(newResult);
    }

    private _getProperties(dn: string)
    {
        const props = this._propertiesMap[dn];
        return props;
    }

    registerNode(dn: string)
    {
        const parsedDn = parseDn(dn);
        const lastRn = _.last(parsedDn);
        if (!lastRn) {
            throw new Error("Empty DN provided");
        }
        
        const node : SnapshotNodeConfig = {
            kind: lastRn.kind,
            rn: '',
            name: lastRn.name ?? undefined
        }

        this._nodeMap[dn] = node;

        if (!this._kindMap[node.kind])
        {
            this._kindMap[node.kind] = {};
        }
        this._kindMap[node.kind]![dn] = node;

        this._registerChild(dn);
    }

    registerProperties(dn: string, propsConfig: SnapshotPropsConfig)
    {
        if (!this._propertiesMap[dn]) {
            this._propertiesMap[dn] = {};
        }
        this._propertiesMap[dn][propsConfig.id] = propsConfig;
    }

    private _registerChild(dn: string)
    {
        const parent_dn = parentDn(dn);
        if (parent_dn) {
            let parent = this._childrenMap[parent_dn];
            if (!parent) {
                parent = [];
                this._childrenMap[parent_dn] = parent;
            }
            parent.push(dn);
        }
    }

    async debugOutputToDir(logger: ILogger, relPath: string) : Promise<void>
    {
        for(const dn of _.keys(this._nodeMap))
        {
            const filePath = `${relPath}/${sanitizeDnPath(dn)}/node.json`;
            const node = this._nodeMap[dn];
            await logger.outputFile(filePath, node);
        }

        for(const dn of _.keys(this._childrenMap))
        {
            const filePath = `${relPath}/${sanitizeDnPath(dn)}/children.json`;
            const children = this._childrenMap[dn];
            await logger.outputFile(filePath, children);
        }
 
        for(const dn of _.keys(this._propertiesMap))
        {
            const propsMap = this._propertiesMap[dn];

            for(const propName of _.keys(propsMap))
            {
                const props = propsMap[propName];
                const filePath = `${relPath}/${sanitizeDnPath(dn)}/props-${props.id}.json`;
                await logger.outputFile(filePath, props);
            }
        }
    }

}
