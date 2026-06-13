import { App, PluginSettingTab, Setting } from 'obsidian';
import type LinkSuggestionPrioritizerPlugin from '../main';
import {
	type Rule,
	type Criterion,
	type CriterionType,
	type PropertyMode,
} from './types';

function randomId(): string {
	return Math.random().toString(36).slice(2, 10);
}

function defaultCriterion(type: CriterionType): Criterion {
	if (type === 'property') return { type, key: '', mode: 'exists' };
	return { type, pattern: '' };
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

		// Master enable
		new Setting(containerEl)
			.setName('Enable reordering')
			.setDesc('When enabled, rules below reorder the [[...]] link suggestions.')
			.addToggle(t =>
				t.setValue(this.plugin.settings.enabled).onChange(async v => {
					this.plugin.settings.enabled = v;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl).setName('Rules').setHeading();
		containerEl.createEl('p', {
			text: 'Rules are evaluated top-to-bottom; the first matching rule decides where a note appears. Each rule\'s criteria are combined with and.',
			cls: 'setting-item-description',
		});

		// Rule cards
		for (let i = 0; i < this.plugin.settings.rules.length; i++) {
			this.renderRule(containerEl, i);
		}

		// Add rule button
		new Setting(containerEl).addButton(b =>
			b.setButtonText('Add rule').onClick(async () => {
				this.plugin.settings.rules.push({
					id: randomId(),
					name: '',
					enabled: true,
					direction: 'prioritize',
					criteria: [],
				});
				await this.plugin.saveSettings();
				this.display();
			}),
		);
	}

	private renderRule(containerEl: HTMLElement, index: number): void {
		const rule = this.plugin.settings.rules[index]!;
		const save = async () => {
			await this.plugin.saveSettings();
		};

		const card = containerEl.createDiv({ cls: 'lsp-rule-card' });

		// Rule header row: enable + name + direction + controls
		const header = new Setting(card)
			.addToggle(t =>
				t.setValue(rule.enabled).onChange(async v => {
					rule.enabled = v;
					await save();
				}),
			)
			.addText(t =>
				t
					.setPlaceholder('Rule name (optional)')
					.setValue(rule.name)
					.onChange(async v => {
						rule.name = v;
						await save();
					}),
			)
			.addDropdown(d =>
				d
					.addOption('prioritize', 'Prioritize (move to top)')
					.addOption('deprioritize', 'Deprioritize (move to bottom)')
					.setValue(rule.direction)
					.onChange(async v => {
						rule.direction = v as Rule['direction'];
						await save();
					}),
			)
			.addExtraButton(b =>
				b
					.setIcon('arrow-up')
					.setTooltip('Move rule up')
					.setDisabled(index === 0)
					.onClick(async () => {
						if (index === 0) return;
						const r = this.plugin.settings.rules;
						[r[index - 1], r[index]] = [r[index]!, r[index - 1]!];
						await save();
						this.display();
					}),
			)
			.addExtraButton(b =>
				b
					.setIcon('arrow-down')
					.setTooltip('Move rule down')
					.setDisabled(index === this.plugin.settings.rules.length - 1)
					.onClick(async () => {
						const r = this.plugin.settings.rules;
						if (index >= r.length - 1) return;
						[r[index], r[index + 1]] = [r[index + 1]!, r[index]!];
						await save();
						this.display();
					}),
			)
			.addExtraButton(b =>
				b
					.setIcon('trash')
					.setTooltip('Delete rule')
					.onClick(async () => {
						this.plugin.settings.rules.splice(index, 1);
						await save();
						this.display();
					}),
			);

		header.setName(`Rule ${index + 1}`);

		// Criteria sub-section
		const criteriaContainer = card.createDiv({ cls: 'lsp-criteria' });

		for (let ci = 0; ci < rule.criteria.length; ci++) {
			this.renderCriterion(criteriaContainer, rule, ci, save);
		}

		new Setting(criteriaContainer).addButton(b =>
			b.setButtonText('Add criterion').onClick(async () => {
				rule.criteria.push(defaultCriterion('path'));
				await save();
				this.display();
			}),
		);
	}

	private renderCriterion(
		container: HTMLElement,
		rule: Rule,
		ci: number,
		save: () => Promise<void>,
	): void {
		const c = rule.criteria[ci]!;

		const row = new Setting(container)
			.addDropdown(d =>
				d
					.addOption('path', 'Path')
					.addOption('tag', 'Tag')
					.addOption('property', 'Property')
					.setValue(c.type)
					.onChange(async v => {
						rule.criteria[ci] = defaultCriterion(v as CriterionType);
						await save();
						this.display();
					}),
			)
			.addExtraButton(b =>
				b
					.setIcon('x')
					.setTooltip('Remove criterion')
					.onClick(async () => {
						rule.criteria.splice(ci, 1);
						await save();
						this.display();
					}),
			);

		// Contextual fields
		if (c.type === 'path') {
			row.addText(t =>
				t
					.setPlaceholder('Glob, e.g. Projects/**')
					.setValue(c.pattern ?? '')
					.onChange(async v => {
						c.pattern = v;
						await save();
					}),
			);
			row.setName('Path');
		} else if (c.type === 'tag') {
			row.addText(t =>
				t
					.setPlaceholder('Glob, e.g. Project or project/**')
					.setValue(c.pattern ?? '')
					.onChange(async v => {
						c.pattern = v;
						await save();
					}),
			);
			row.setName('Tag');
		} else {
			// property
			row.addText(t =>
				t
					.setPlaceholder('Property key')
					.setValue(c.key ?? '')
					.onChange(async v => {
						c.key = v;
						await save();
					}),
			);
			row.addDropdown(d =>
				d
					.addOption('exists', 'Exists')
					.addOption('equals', 'Equals')
					.addOption('contains', 'Contains')
					.setValue(c.mode ?? 'exists')
					.onChange(async v => {
						c.mode = v as PropertyMode;
						await save();
					}),
			);
			if (c.mode === 'equals' || c.mode === 'contains') {
				row.addText(t =>
					t
						.setPlaceholder('Value')
						.setValue(c.value ?? '')
						.onChange(async v => {
							c.value = v;
							await save();
						}),
				);
			}
			row.setName('Property');
		}
	}
}
