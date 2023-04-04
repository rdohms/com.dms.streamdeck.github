import {DisplayStack} from "./DisplayStack";
import {allImg, changeSvgState, draftImg, githubImg, imgState, pullRequestImg} from "./images";

export type DisplayIndicator = {indicator?: {value: number}}
export type CardData = {
    value: string,
    title: string,
    icon: string,
} & DisplayIndicator

export interface DisplayCard {
    toPayload(): CardData;
    getId(): string;
    getUrl(): string[];
}
export class IndividualDisplayCard implements DisplayCard {
    public repository: string;
    public repositoryWithOwner: string;
    public number: number;
    public status: string;
    public url: string;
    public title: string
    public state: string
    public isDraft: boolean
    public isReadByViewer: boolean
    public reviewDecision: string
    public mergeable: string
    public stateRollup: string


    constructor(repository: string, repositoryWithOwner: string, number: number, status: string, url: string, title: string, state: string, isDraft: boolean, isReadByViewer: boolean, reviewDecision: string, mergeable: string, stateRollup: string) {
        this.repository = repository;
        this.repositoryWithOwner = repositoryWithOwner;
        this.number = number;
        this.status = status;
        this.url = url;
        this.title = title;
        this.state = state;
        this.isDraft = isDraft;
        this.isReadByViewer = isReadByViewer;
        this.reviewDecision = reviewDecision;
        this.mergeable = mergeable;
        this.stateRollup = stateRollup;
    }

    getUrl(): string[] {
        return [this.url];
    }

    getId(): string {
        return `${this.repositoryWithOwner}#${this.number}`;
    }

    toPayload(): CardData {
        console.log(this);
        let iconState;
        switch(this.stateRollup) {
            case 'SUCCESS':
                iconState = imgState.passing;
                break;
            case 'PENDING':
            case 'EXPECTED':
                iconState = imgState.alarm;
                break;
            case 'ERROR':
            case 'FAILURE':
                iconState = imgState.failing;
                break;
            default:
                iconState = imgState.neutral;
                break;

        }
        return {
            value: `#${String(this.number)}: ${this.title}`,
            title: this.repositoryWithOwner,
            icon: changeSvgState(
                this.isDraft ? draftImg : pullRequestImg,
                iconState
            ),
        }
    }
}

export class MainDisplayCard implements DisplayCard {
    public issueCount: number;

    constructor(issueCount: number) {
        this.issueCount = issueCount;
    }

    getUrl(): string[] {
        return ["https://github.com/pulls/review-requested"];
    }

    getId(): string {
        return DisplayStack.MAIN_DISPLAY_ID;
    }

    toPayload(): CardData {
        return {
            value: String(this.issueCount),
            title: 'Open PRs',
            icon: changeSvgState(githubImg, this.issueCount > 5? imgState.alarm : imgState.neutral),
        }
    }
}

export class AllDisplayCard implements DisplayCard {
    public stack: DisplayStack;
    constructor(stack: DisplayStack) {
        this.stack = stack;
    }
    getUrl(): string[] {
        return Object.entries(this.stack.stack).map(([, card]) => {
            if (card instanceof IndividualDisplayCard) {
                return card.url;
            }
            return '';
        }).filter(url => url !== '');
    }
    toPayload(): CardData {
        return {
            value: 'ALL',
            title: 'Open PRs',
            icon: allImg,
        }
    }
    getId(): string {
        return DisplayStack.ALL_DISPLAY_ID;
    }
}

export class ErrorCard implements DisplayCard {
    public status: string;
    constructor(status: string) {
        this.status = status;
    }
    toPayload(): CardData {
        return {
            value: `Err: ${this.status}`,
            title: 'Query failed!',
            icon: changeSvgState(githubImg, imgState.failing),
        }
    }
    getId(): string {
        return 'error';
    }

    getUrl(): string[] {
        return [];
    }
}
