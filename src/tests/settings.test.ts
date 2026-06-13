import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, type PluginSettings, type Rule } from '../settings/types';

describe('DEFAULT_SETTINGS', () => {
	it('has the expected shape', () => {
		expect(DEFAULT_SETTINGS).toEqual({ enabled: true, rules: [], version: 1 });
	});
});

describe('loadSettings merge', () => {
	const merge = (saved: unknown): PluginSettings =>
		Object.assign({}, DEFAULT_SETTINGS, saved as Partial<PluginSettings>);

	it('keeps defaults when saved data is empty', () => {
		expect(merge({})).toEqual(DEFAULT_SETTINGS);
	});

	it('overrides only provided keys', () => {
		const result = merge({ enabled: false });
		expect(result.enabled).toBe(false);
		expect(result.rules).toEqual([]);
		expect(result.version).toBe(1);
	});

	it('preserves saved rules array', () => {
		const rule: Rule = {
			id: 'r1',
			name: 'Test',
			enabled: true,
			direction: 'prioritize',
			criteria: [{ type: 'path', pattern: 'Projects/**' }],
		};
		const result = merge({ rules: [rule] });
		expect(result.rules).toHaveLength(1);
		expect(result.rules[0]).toEqual(rule);
	});
});
