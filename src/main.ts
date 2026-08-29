import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings, PrioritizerSettingTab } from './settings';
import { installPatch } from './patch';

export default class LinkSuggestionPrioritizerPlugin extends Plugin {
	settings!: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new PrioritizerSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			const uninstall = installPatch(this.app, () => this.settings);
			this.register(uninstall);
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
