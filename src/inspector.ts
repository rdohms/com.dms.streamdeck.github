import {DidReceiveGlobalSettingsEvent, DidReceiveSettingsEvent, Inspector} from "@fnando/streamdeck";
import plugin from "./plugin";
import {PluginSettings} from "./PluginSettings";

class DefaultPropertyInspector extends Inspector {
  protected settings: PluginSettings = {ghtoken: "", ghe_apiurl: ""};
  public ghtoken: HTMLInputElement;
  public ghe_apiurl: HTMLInputElement;
  public saveBtn: HTMLButtonElement;

  handleDidConnectToSocket(): void {
    this.ghtoken = document.querySelector("#ghtoken");
    this.ghe_apiurl = document.querySelector("#ghe_apiurl");
    this.saveBtn = document.querySelector("#save");

    this.saveBtn.disabled = false;

    this.saveBtn.onclick = () => {
      if (!this.ghtoken.value) {
        alert("Please inform your GH Token");
        return;
      }

      this.setSettings({
        ghtoken: this.ghtoken.value,
        ghe_apiurl: this.ghe_apiurl.value,
      });
    };

    document.querySelectorAll<HTMLElement>("[data-url]").forEach((node) => {
      node.onclick = () => {
        this.openURL(node.dataset.url);
      };
    });
  }

  handleDidReceiveSettings({settings}: DidReceiveSettingsEvent<PluginSettings>) {
    this.settings = settings;
    this.fillInForm();
  }

  fillInForm() {
    this.ghtoken.value = this.settings.ghtoken;
    this.ghe_apiurl.value = this.settings.ghe_apiurl;
  }
}

const inspector = new DefaultPropertyInspector({ plugin });

inspector.run();
