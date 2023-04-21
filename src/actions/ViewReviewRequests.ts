import {
    Action,
    DialPressEvent,
    DialRotateEvent, DidReceiveSettingsEvent,
    Encoder,
    Layout,
    WillAppearEvent
} from "@fnando/streamdeck";
import {Octokit} from "octokit";
import {PluginSettings} from "../PluginSettings";
import {DisplayStack} from "./ViewReviewRequests/DisplayStack";
import {CardData, ErrorCard} from "./ViewReviewRequests/DisplayCard";
import {downloadingImg} from "./ViewReviewRequests/images";
import {ApiClientBuilder} from "../helpers/ApiClientBuilder";

const TITLE_MAX_LENGTH = 14;
const VALUE_MAX_LENGTH = 8;

const defaultQuery = `{
  prsToReview: search(query: "type:pr review-requested:@me state:open", type: ISSUE, first: 50) {
    issueCount
    edges {
      node {
        ... on PullRequest {
          title
          url
          state
          isDraft
          isReadByViewer
          number
          reviewDecision
          mergeable
          repository {
            name
            nameWithOwner
          }
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  state
                }
              }
            }
          }
        }
      }
    }
  }
}`;

export type PRQueryResult = { prsToReview: {
    issueCount: number,
        edges: [{node: {title: string, url: string, number: number, state: string, isDraft: boolean, isReadByViewer: boolean, reviewDecision: string, mergeable: string, repository: { name: string, nameWithOwner: string}, commits: {nodes: {commit: {statusCheckRollup: string}}}}}]
} }

let tickerId: NodeJS.Timer;

class ViewReviewRequests extends Action {
  public client: Octokit;
  public displayStack: DisplayStack = new DisplayStack();
  public apiPollerId: NodeJS.Timer

  async startPollingAPI() {
    clearInterval(this.apiPollerId);

    this.setFeedbackLayout(Layout.ICON_LAYOUT);
    this.setFeedback({
      title: "Downloading PRs",
      icon: downloadingImg,
    });

    await this.queryAndUpdate();
    this.apiPollerId = setInterval(async () => {
      await this.queryAndUpdate();
    }, 60 * 1000);
  }

  setupClient(settings: PluginSettings, force: boolean = false) {
    if (this.client !== undefined && force == false) {
      return;
    }

    this.client = ApiClientBuilder.getClient(settings);
  }

  async handleDidReceiveSettings(event: DidReceiveSettingsEvent<PluginSettings>) {
    this.setupClient(event.settings, true);
    await this.startPollingAPI();
  }

  async queryAndUpdate() {
    try {
      const result: PRQueryResult = await this.client.graphql(defaultQuery);

      this.displayStack = new DisplayStack();
      this.displayStack.populateFromQueryResult(result);
      this.renderCurrentCard();
    } catch (err) {
      this.displayStack = new DisplayStack();
      this.displayStack.addToStack(new ErrorCard(err.status));
      this.renderCurrentCard();
    }
  }

  async handleWillAppear(event: WillAppearEvent) {
    super.handleWillAppear(event);

    this.setupClient(event.settings as PluginSettings);
    await this.startPollingAPI();
  }

  handleDialRotate(event: DialRotateEvent) {
    super.handleDialRotate(event);
    this.displayStack.navigateTicks(event.ticks);
    this.renderCurrentCard();
  }

  handleDialPress(event: DialPressEvent) {
    super.handleDialPress(event);
    if (event.pressed === false) {
      return;
    }
    this.displayStack
      .getCurrent()
      .getUrl()
      .forEach((url) => this.openURL(url));
  }

  renderCurrentCard() {
    const cardData = JSON.parse(
      JSON.stringify(this.displayStack.getCurrentCardAsLayout())
    );

    this.setFeedbackLayout(Layout.INDICATOR_LAYOUT);
    this.setFeedback(cardData as unknown as Record<string, string>);
    this.tickTitleAndValue(cardData);
  }

  tickTitleAndValue(data: CardData) {
    clearInterval(tickerId);

    if (
      data.title.length <= TITLE_MAX_LENGTH &&
      data?.value.length <= VALUE_MAX_LENGTH
    ) {
      return;
    }

    tickerId = setInterval(async () => {
      data.title = this.tickString(data.title, TITLE_MAX_LENGTH);
      data.value = this.tickString(data.value, VALUE_MAX_LENGTH);

      this.setFeedback({
        ...data,
        title: data.title.substring(0, TITLE_MAX_LENGTH),
        value: data.value.substring(0, VALUE_MAX_LENGTH),
      } as unknown as Record<string, string>);
    }, 100);
  }

  private tickString(string, maxLength) {
    if (string.length <= maxLength) {
      return string;
    }

    return string.substring(1) + string.substring(0, 1);
  }
}

const action = new ViewReviewRequests({
    name: "View Requested Reviews",
    states: [{ image: "Key" }],
});

action.encoder = new Encoder();
action.keyPad = false;

export default action;
