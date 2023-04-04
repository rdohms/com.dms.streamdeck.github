import { Plugin } from "@fnando/streamdeck";
import * as config from "./streamdeck.json";
import ViewReviewRequests from "./actions/ViewReviewRequests";

const plugin = new Plugin({ ...config, actions: [ViewReviewRequests] });

export default plugin;
