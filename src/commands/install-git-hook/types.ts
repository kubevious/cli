export interface InstallHookCommandData {
    success: boolean,
    hook: {
        repo: string,
        id: string
    },
    errors: string[],
    repoPath: string,
    preCommitConfigPath: string,

    steps: {
        name: string,
        success: boolean
    }[],
} 

export interface InstallHookOptions {
    hook: string
}


export interface PreCommitConfigSpec
{
    repos: PreCommitRepoSpec[];
}

export interface PreCommitRepoSpec
{
    repo: string;
    rev?: string;
    hooks?: PreCommitHookSpec[];
}


export interface PreCommitHookSpec
{
    id: string;
}