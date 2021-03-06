import { GithubClientConfigs } from './Config';
import { Logger } from './Logger';

const Octokit = require("@octokit/rest").plugin(require("@octokit/plugin-throttling")).plugin(require("@octokit/plugin-retry"));

export class GithubClientFactory  {
    octokitClient;
    constructor(private readonly config: GithubClientConfigs, logger :Logger) {
        this.octokitClient = new Octokit({
            auth: config.token,
            log: logger,
            throttle: {
                onRateLimit: (retryAfter, options) => {
                    logger.silly(`Request quota exhausted for ${options.method} ${options.url} - waiting ${retryAfter} seconds before going on with requests`);
                    return true;
                },
                onAbuseLimit: (retryAfter, options) => {
                    logger.warn(`Request abuse detected for ${options.method} ${options.url} - waiting ${retryAfter} seconds before going on with requests`);
                    return true;
                },
            },
        });

        this.octokitClient.hook.before('request', options => {
            logger.debug(`New request ${options.method} ${options.url}`);
        });
        this.octokitClient.hook.after('request', (response, options) => {
            logger.debug(`Request ${options.method} ${options.url} finished`);
        });
        this.octokitClient.hook.error('request', (error, options) => {
            logger.error(`Request ${options.method} ${options.url} error`);
            logger.error(`${error}`);
            return {};
        });
    }

    getOctokitClient = () => this.octokitClient;
}
