export interface ServerConfigs {
    port: number;
}

export interface GithubClientConfigs {
    token: string;
}

export interface GithubConfigs {
    organisation: string;
    teams: string[];
}

export interface LogsConfigs {
    level: string;
}

export interface Configs {
    github: GithubConfigs;
    githubClient: GithubClientConfigs;
    server: ServerConfigs;
    log: LogsConfigs;
    timeBetweenExtractionInMS: number;
}

export class EnvironmentConfigs implements Configs {
    github!: GithubConfigs;
    githubClient!: GithubClientConfigs;
    server!: ServerConfigs;
    log!: LogsConfigs;
    timeBetweenExtractionInMS!: number;

    constructor() {
        Object.assign(this, {
            github: {
                organisation: process.env.GITHUB_ORGANISATION,
                teams: ['CRM'],
            },
            githubClient: {
                token: process.env.GITHUB_TOKEN || 'MISSING',
            },
            log: {
                level: process.env.LOG_LEVEL || 'debug',
            },
            server: {
                port: process.env.HTTP_PORT || 80,
            },
            // 20 min in MS
            timeBetweenExtractionInMS: 1200000,
        });
    }
}
