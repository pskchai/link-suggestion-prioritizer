export type Direction = 'prioritize' | 'deprioritize';
export type CriterionType = 'path' | 'tag' | 'property';
export type PropertyMode = 'exists' | 'equals' | 'contains';

export interface Criterion {
	type: CriterionType;
	pattern?: string;
	key?: string;
	mode?: PropertyMode;
	value?: string;
}

export interface Rule {
	id: string;
	name: string;
	enabled: boolean;
	direction: Direction;
	criteria: Criterion[];
}

export interface PluginSettings {
	enabled: boolean;
	rules: Rule[];
	version: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	enabled: true,
	rules: [],
	version: 1,
};
