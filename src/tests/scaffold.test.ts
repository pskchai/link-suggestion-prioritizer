import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '../settings/types';

describe('scaffold', () => {
	it('DEFAULT_SETTINGS has expected shape', () => {
		expect(DEFAULT_SETTINGS.enabled).toBe(true);
		expect(DEFAULT_SETTINGS.rules).toEqual([]);
		expect(DEFAULT_SETTINGS.version).toBe(1);
	});
});
