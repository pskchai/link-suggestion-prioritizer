import { describe, it, expect } from 'vitest';
import { evaluateCriterion, evaluateRule, type FileMeta } from '../core/matching';
import type { Criterion, Rule } from '../settings/types';

const meta = (override: Partial<FileMeta> = {}): FileMeta => ({
	path: 'folder/note.md',
	tags: [],
	frontmatter: {},
	...override,
});

describe('evaluateCriterion — path', () => {
	it('matches glob against file path', () => {
		const c: Criterion = { type: 'path', pattern: 'folder/**' };
		expect(evaluateCriterion(c, meta())).toBe(true);
	});
	it('no match when path differs', () => {
		const c: Criterion = { type: 'path', pattern: 'other/**' };
		expect(evaluateCriterion(c, meta())).toBe(false);
	});
	it('missing pattern always false', () => {
		expect(evaluateCriterion({ type: 'path' }, meta())).toBe(false);
	});
});

describe('evaluateCriterion — tag', () => {
	it('matches exact tag (without #)', () => {
		const c: Criterion = { type: 'tag', pattern: 'project' };
		expect(evaluateCriterion(c, meta({ tags: ['#project'] }))).toBe(true);
	});
	it('matches nested tag with glob', () => {
		const c: Criterion = { type: 'tag', pattern: 'project/**' };
		expect(evaluateCriterion(c, meta({ tags: ['#project/active'] }))).toBe(true);
	});
	it('matches parent prefix pattern against child tag', () => {
		const c: Criterion = { type: 'tag', pattern: 'project*' };
		expect(evaluateCriterion(c, meta({ tags: ['#project/active'] }))).toBe(false);
	});
	it('no match when tag absent', () => {
		const c: Criterion = { type: 'tag', pattern: 'project' };
		expect(evaluateCriterion(c, meta({ tags: ['#other'] }))).toBe(false);
	});
	it('missing pattern always false', () => {
		expect(evaluateCriterion({ type: 'tag' }, meta({ tags: ['#x'] }))).toBe(false);
	});
	it('case-insensitive tag match', () => {
		const c: Criterion = { type: 'tag', pattern: 'Project' };
		expect(evaluateCriterion(c, meta({ tags: ['#project'] }))).toBe(true);
	});
});

describe('evaluateCriterion — property exists', () => {
	it('true when key present and non-null', () => {
		const c: Criterion = { type: 'property', key: 'status', mode: 'exists' };
		expect(evaluateCriterion(c, meta({ frontmatter: { status: 'active' } }))).toBe(true);
	});
	it('false when key absent', () => {
		const c: Criterion = { type: 'property', key: 'status', mode: 'exists' };
		expect(evaluateCriterion(c, meta({ frontmatter: {} }))).toBe(false);
	});
	it('false when key is null', () => {
		const c: Criterion = { type: 'property', key: 'status', mode: 'exists' };
		expect(evaluateCriterion(c, meta({ frontmatter: { status: null } }))).toBe(false);
	});
});

describe('evaluateCriterion — property equals', () => {
	it('string equality', () => {
		const c: Criterion = { type: 'property', key: 'status', mode: 'equals', value: 'active' };
		expect(evaluateCriterion(c, meta({ frontmatter: { status: 'active' } }))).toBe(true);
	});
	it('string inequality', () => {
		const c: Criterion = { type: 'property', key: 'status', mode: 'equals', value: 'active' };
		expect(evaluateCriterion(c, meta({ frontmatter: { status: 'done' } }))).toBe(false);
	});
	it('number coercion', () => {
		const c: Criterion = { type: 'property', key: 'priority', mode: 'equals', value: '1' };
		expect(evaluateCriterion(c, meta({ frontmatter: { priority: 1 } }))).toBe(true);
	});
});

describe('evaluateCriterion — property contains', () => {
	it('array includes scalar value', () => {
		const c: Criterion = { type: 'property', key: 'tags', mode: 'contains', value: 'work' };
		expect(evaluateCriterion(c, meta({ frontmatter: { tags: ['work', 'home'] } }))).toBe(true);
	});
	it('array does not include value', () => {
		const c: Criterion = { type: 'property', key: 'tags', mode: 'contains', value: 'other' };
		expect(evaluateCriterion(c, meta({ frontmatter: { tags: ['work'] } }))).toBe(false);
	});
	it('string substring match', () => {
		const c: Criterion = { type: 'property', key: 'title', mode: 'contains', value: 'note' };
		expect(evaluateCriterion(c, meta({ frontmatter: { title: 'my note here' } }))).toBe(true);
	});
	it('string no substring', () => {
		const c: Criterion = { type: 'property', key: 'title', mode: 'contains', value: 'xyz' };
		expect(evaluateCriterion(c, meta({ frontmatter: { title: 'my note' } }))).toBe(false);
	});
});

describe('evaluateRule', () => {
	const rule = (criteria: Criterion[], enabled = true): Rule => ({
		id: 'r1', name: '', enabled, direction: 'prioritize', criteria,
	});

	it('true when all criteria match', () => {
		const r = rule([
			{ type: 'path', pattern: 'folder/**' },
			{ type: 'tag', pattern: 'project' },
		]);
		expect(evaluateRule(r, meta({ tags: ['#project'] }))).toBe(true);
	});
	it('false when one criterion fails (AND logic)', () => {
		const r = rule([
			{ type: 'path', pattern: 'folder/**' },
			{ type: 'tag', pattern: 'project' },
		]);
		expect(evaluateRule(r, meta({ tags: [] }))).toBe(false);
	});
	it('disabled rule always false', () => {
		const r = rule([{ type: 'path', pattern: 'folder/**' }], false);
		expect(evaluateRule(r, meta())).toBe(false);
	});
	it('empty criteria is true (match-all)', () => {
		expect(evaluateRule(rule([]), meta())).toBe(true);
	});
});
