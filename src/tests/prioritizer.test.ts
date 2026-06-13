import { describe, it, expect } from 'vitest';
import { reorder } from '../core/prioritizer';
import type { FileMeta } from '../core/matching';
import type { Rule } from '../settings/types';

type Item = { id: string; path: string };

const rule = (id: string, direction: 'prioritize' | 'deprioritize', pathPattern: string): Rule => ({
	id, name: id, enabled: true, direction,
	criteria: [{ type: 'path', pattern: pathPattern }],
});

const getMeta = (item: Item): FileMeta => ({
	path: item.path, tags: [], frontmatter: {},
});

const ids = (items: Item[]) => items.map(i => i.id);

describe('reorder — three-band layout', () => {
	const rules = [rule('R1', 'prioritize', 'top/**'), rule('R2', 'deprioritize', 'bottom/**')];
	const items: Item[] = [
		{ id: 'a', path: 'bottom/a.md' },
		{ id: 'b', path: 'mid/b.md' },
		{ id: 'c', path: 'top/c.md' },
		{ id: 'd', path: 'mid/d.md' },
	];

	it('prioritized first, unmatched middle, deprioritized last', () => {
		const result = reorder(items, getMeta, rules);
		expect(ids(result)).toEqual(['c', 'b', 'd', 'a']);
	});
});

describe('reorder — rule order within bands', () => {
	// rule0 = highest priority (rule index 0), rule1 second
	const rules = [
		rule('R0', 'prioritize', 'vip/**'),
		rule('R1', 'prioritize', 'top/**'),
	];
	const items: Item[] = [
		{ id: 'a', path: 'top/a.md' },   // matches R1
		{ id: 'b', path: 'vip/b.md' },   // matches R0
		{ id: 'c', path: 'mid/c.md' },   // unmatched
	];

	it('rule 0 matches come before rule 1 matches', () => {
		const result = reorder(items, getMeta, rules);
		expect(ids(result)).toEqual(['b', 'a', 'c']);
	});
});

describe('reorder — deprioritize rule order (rule 0 at very bottom)', () => {
	const rules = [
		rule('R0', 'deprioritize', 'worst/**'),
		rule('R1', 'deprioritize', 'bad/**'),
	];
	const items: Item[] = [
		{ id: 'a', path: 'bad/a.md' },    // R1
		{ id: 'b', path: 'worst/b.md' },  // R0
		{ id: 'c', path: 'mid/c.md' },    // unmatched
	];

	it('unmatched first, rule 1 before rule 0 (rule 0 = very bottom)', () => {
		const result = reorder(items, getMeta, rules);
		expect(ids(result)).toEqual(['c', 'a', 'b']);
	});
});

describe('reorder — within-group stability', () => {
	const rules = [rule('R1', 'prioritize', 'top/**')];
	const items: Item[] = [
		{ id: 'a', path: 'top/a.md' },
		{ id: 'b', path: 'top/b.md' },
		{ id: 'c', path: 'top/c.md' },
	];

	it('preserves original order within the prioritize group', () => {
		expect(ids(reorder(items, getMeta, rules))).toEqual(['a', 'b', 'c']);
	});
});

describe('reorder — first matching rule wins', () => {
	const rules = [
		rule('R0', 'prioritize', 'shared/**'),
		rule('R1', 'deprioritize', 'shared/**'),
	];
	const items: Item[] = [
		{ id: 'a', path: 'shared/a.md' },
		{ id: 'b', path: 'other/b.md' },
	];

	it('note matches R0 (prioritize) because it comes first', () => {
		const result = reorder(items, getMeta, rules);
		expect(ids(result)).toEqual(['a', 'b']);
	});
});

describe('reorder — items without resolvable meta stay in middle', () => {
	const rules = [rule('R1', 'prioritize', 'top/**')];
	const items: Item[] = [
		{ id: 'a', path: 'top/a.md' },
		{ id: 'b', path: 'mid/b.md' },
	];

	it('null meta falls to unmatched middle', () => {
		const getMetaWithNull = (item: Item): FileMeta | null =>
			item.id === 'b' ? null : getMeta(item);
		const result = reorder(items, getMetaWithNull, rules);
		expect(ids(result)).toEqual(['a', 'b']);
	});
});

describe('reorder — no rules returns original order', () => {
	const items: Item[] = [
		{ id: 'a', path: 'x/a.md' },
		{ id: 'b', path: 'x/b.md' },
	];
	it('returns items unchanged when rules is empty', () => {
		expect(ids(reorder(items, getMeta, []))).toEqual(['a', 'b']);
	});
});
