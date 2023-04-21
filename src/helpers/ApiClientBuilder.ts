import {PluginSettings} from "../PluginSettings";
import {Octokit} from "octokit";

export class ApiClientBuilder{
    static getClient(settings: PluginSettings): Octokit {
        const config: {auth: string, baseUrl?: string} = {
            auth: settings.ghtoken,
        };

        if (settings.ghe_apiurl !== undefined && settings.ghe_apiurl !== "") {
            config.baseUrl = settings.ghe_apiurl;
        }
        console.log(config);
        return new Octokit(config);
    }
}
