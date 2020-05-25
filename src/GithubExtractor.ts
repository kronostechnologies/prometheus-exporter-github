import { Logger } from './Logger'
import { Metrics } from "./Metrics";
import { GithubConfigs } from "./Config";
import { GithubRepository } from "./GithubRepository";

export class GithubExtractor {
    constructor(
        private readonly repository: GithubRepository,
        private readonly logger: Logger,
        private readonly metrics: Metrics,
        private readonly config: GithubConfigs,
    ) {
    }

    async processRepoPulls(repository): Promise<void> {
        let pullOpen = 0;
        let pullClose = 0;

        for (const pull of await this.repository.getPullsForRepository(repository)) {
            if (pull.state === 'open') {
                pullOpen += 1;
            } else {
                pullClose += 1;
            }

        }
        this.metrics.setRepoPullRequestsCloseGauge(
            { owner: repository.owner.login, repo: repository.name },
            pullClose,
        );
        this.metrics.setRepoPullRequestsOpenGauge(
            { owner: repository.owner.login, repo: repository.name },
            pullOpen,
        );
        this.metrics.setRepoPullRequestsGauge(
            { owner: repository.owner.login, repo: repository.name },
            pullClose + pullOpen,
        );
    }

    async processPulls(): Promise<void> {
        this.metrics.setPullRequestsGauge(
            { owner: this.config.organisation },
            await this.repository.getPRCount()
        );
        this.metrics.setPullRequestsOpenGauge(
            { owner: this.config.organisation },
            await this.repository.getPROpenCount()
        );
        this.metrics.setPullRequestsCloseGauge(
            { owner: this.config.organisation },
            await this.repository.getPRCloseCount()
        );
        this.metrics.setPullRequestsMergedGauge(
            { owner: this.config.organisation },
            await this.repository.getPRMergedCount()
        );
        this.metrics.setPullRequestsOpenApprovedGauge(
            { owner: this.config.organisation },
            await this.repository.getPROpenAndApproved()
        );
        this.metrics.setPullRequestsOpenWaitingApprovalGauge(
            { owner: this.config.organisation },
            await this.repository.getPROpenAndNotApproved()
        );
    }

    async processBranches(repository): Promise<void> {
        this.metrics.setRepoBranchesGauge(
            { owner: repository.owner.login, repo: repository.name },
            await this.repository.getCountofBranchesInRepository(repository),
        );
    }

    async processOrganisationRepositories(): Promise<void> {
        let repositoryCount = 0;
        let repositoryPrivateCount = 0;
        let repositoryPublicCount = 0;

        await this.processPulls();

        for (const repository of await this.repository.getRepositoryListForOrg()) { // eslint-disable-line no-restricted-syntax
            if (repository.private) {
                repositoryPrivateCount += 1;
            } else {
                repositoryPublicCount += 1;
            }
            this.metrics.setRepoStarsGauge(
                { owner: repository.owner.login, repo: repository.name },
                repository.stargazers_count,
            );
            this.metrics.setRepoForksGauge(
                { owner: repository.owner.login, repo: repository.name },
                repository.forks_count,
            );
            this.metrics.setRepoOpenIssuesGauge(
                { owner: repository.owner.login, repo: repository.name },
                repository.open_issues_count,
            );

            await this.processRepoPulls(repository);
            await this.processBranches(repository);

        }
        this.logger.debug(`Processing ${repositoryCount} repositories`);
        this.metrics.setRepoGauge(
            { owner: this.config.organisation },
            repositoryCount,
        );
        this.metrics.setRepoPrivateGauge(
            { owner: this.config.organisation },
            repositoryPrivateCount,
        );
        this.metrics.setRepoPublicGauge(
            { owner: this.config.organisation },
            repositoryPublicCount,
        );
    }
}
