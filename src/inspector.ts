import {DidReceiveGlobalSettingsEvent, DidReceiveSettingsEvent, Inspector} from "@fnando/streamdeck";
import plugin from "./plugin";
import {PluginSettings} from "./PluginSettings";

class DefaultPropertyInspector extends Inspector {
  protected settings: PluginSettings = {ghtoken: ""};
  public ghtoken: HTMLInputElement;
  public saveBtn: HTMLButtonElement;

  handleDidConnectToSocket(): void {
    this.ghtoken = document.querySelector("#ghtoken");
    this.saveBtn = document.querySelector("#save");

    this.saveBtn.disabled = false;

    this.saveBtn.onclick = () => {
      if (!this.ghtoken.value) {
        alert("Please inform your GH Token");
        return;
      }

      this.setSettings({
        ghtoken: this.ghtoken.value,
      });
    };

    document.querySelectorAll<HTMLElement>("[data-url]").forEach((node) => {
      node.onclick = () => {
        this.openURL(node.dataset.url);
      };
    });
  }

  handleDidReceiveSettings({settings}: DidReceiveSettingsEvent<PluginSettings>) {
    console.log(settings);
    this.settings = settings;
    this.fillInForm();
  }

  fillInForm() {
    this.ghtoken.value = this.settings.ghtoken ?? "";
  }
}

const inspector = new DefaultPropertyInspector({ plugin });

inspector.run();
