import { AbstractInputSuggest, App, getAllTags, PluginSettingTab, Setting, TFolder } from 'obsidian';
import type LinkSuggestionPrioritizerPlugin from './main';
import { validateEntry } from './reorder';

export interface PluginSettings {
	enabled: boolean;
	/** Folder paths (`Projects/Work`) or tag prefixes (`#project`). */
	prioritize: string[];
	deprioritize: string[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
	enabled: true,
	prioritize: [],
	deprioritize: [],
};

/** Autocomplete over the vault's folders and tags. */
class EntrySuggest extends AbstractInputSuggest<string> {
	constructor(
		app: App,
		input: HTMLInputElement,
		private options: string[],
		private onPick: (value: string) => void,
	) {
		super(app, input);
	}

	getSuggestions(query: string): string[] {
		const q = query.trim().toLowerCase();
		return this.options.filter(o => o.toLowerCase().includes(q)).slice(0, 50);
	}

	renderSuggestion(value: string, el: HTMLElement): void {
		el.setText(value);
	}

	selectSuggestion(value: string): void {
		this.setValue(value);
		this.onPick(value);
		this.close();
	}
}

function vaultFolders(app: App): string[] {
	return app.vault
		.getAllFolders()
		.map((f: TFolder) => f.path)
		.sort((a, b) => a.localeCompare(b));
}

function vaultTags(app: App): string[] {
	const tags = new Set<string>();
	for (const file of app.vault.getMarkdownFiles()) {
		const cache = app.metadataCache.getFileCache(file);
		if (cache) for (const tag of getAllTags(cache) ?? []) tags.add(tag);
	}
	return [...tags].sort((a, b) => a.localeCompare(b));
}

export class PrioritizerSettingTab extends PluginSettingTab {
	private plugin: LinkSuggestionPrioritizerPlugin;

	constructor(app: App, plugin: LinkSuggestionPrioritizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Enable reordering')
			.setDesc('When enabled, the lists below reorder the [[...]] link suggestions.')
			.addToggle(t =>
				t.setValue(this.plugin.settings.enabled).onChange(async v => {
					this.plugin.settings.enabled = v;
					await this.plugin.saveSettings();
				}),
			);

		// ponytail: recomputed once per display(); the vault does not change while the tab is open.
		const folders = vaultFolders(this.app);
		const tags = vaultTags(this.app);
		const options = [...folders, ...tags];

		this.renderList(
			'prioritize',
			'Prioritize',
			'Notes in these folders, or with these tags, move to the top.',
			options,
			folders,
			tags,
		);
		this.renderList(
			'deprioritize',
			'Deprioritize',
			'Notes in these folders, or with these tags, move to the bottom.',
			options,
			folders,
			tags,
		);
	}

	private renderList(
		key: 'prioritize' | 'deprioritize',
		title: string,
		desc: string,
		options: string[],
		folders: string[],
		tags: string[],
	): void {
		const entries = this.plugin.settings[key];

		new Setting(this.containerEl).setName(title).setHeading().setDesc(desc);

		entries.forEach((entry, i) => {
			const row = new Setting(this.containerEl)
				.addText(t => {
					t.setPlaceholder('Folder path or #tag')
						.setValue(entry)
						.onChange(async v => {
							entries[i] = v;
							await this.plugin.saveSettings();
							this.setWarning(row, validateEntry(v, folders, tags));
						});
					new EntrySuggest(this.app, t.inputEl, options, v => {
						entries[i] = v;
						void this.plugin.saveSettings();
						this.setWarning(row, validateEntry(v, folders, tags));
					});
				})
				.addExtraButton(b =>
					b
						.setIcon('trash')
						.setTooltip('Remove')
						.onClick(async () => {
							entries.splice(i, 1);
							await this.plugin.saveSettings();
							this.display();
						}),
				);
			row.settingEl.addClass('lsp-entry');
			this.setWarning(row, validateEntry(entry, folders, tags));
		});

		new Setting(this.containerEl).addButton(b =>
			b.setButtonText(`Add to ${title.toLowerCase()}`).onClick(async () => {
				entries.push('');
				await this.plugin.saveSettings();
				this.display();
			}),
		);
	}

	private setWarning(row: Setting, warning: string | null): void {
		row.setDesc(warning ?? '');
		row.settingEl.toggleClass('lsp-warning', warning !== null);
	}
}
