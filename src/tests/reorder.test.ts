import { describe, it, expect } from 'vitest';
import { matchesEntry, reorder, validateEntry, type FileMeta } from '../reorder';

const meta = (path: string, tags: string[] = []): FileMeta => ({ path, tags });

describe('matchesEntry', () => {
	it('matches a note inside the folder, at any depth', () => {
		expect(matchesEntry('Projects', meta('Projects/a.md'))).toBe(true);
		expect(matchesEntry('Projects', meta('Projects/sub/a.md'))).toBe(true);
	});

	it('does not match a folder that is only a name prefix', () => {
		expect(matchesEntry('Proj', meta('Projects/a.md'))).toBe(false);
	});

	it('does not match the folder note itself, only its contents', () => {
		expect(matchesEntry('Projects', meta('Projects.md'))).toBe(false);
	});

	it('ignores a trailing slash and is case-insensitive', () => {
		expect(matchesEntry('projects/', meta('Projects/a.md'))).toBe(true);
	});

	it('matches a tag by prefix', () => {
		expect(matchesEntry('#project', meta('a.md', ['#project']))).toBe(true);
		expect(matchesEntry('#project', meta('a.md', ['#project/active']))).toBe(true);
		expect(matchesEntry('#project', meta('a.md', ['#other']))).toBe(false);
	});

	it('ignores an empty entry', () => {
		expect(matchesEntry('  ', meta('a.md'))).toBe(false);
	});
});

describe('reorder', () => {
	const getMeta = (p: string) => meta(p, p.startsWith('Tagged') ? ['#hot'] : []);
	const items = ['Projects/b.md', 'Notes/a.md', 'Projects/a.md', 'Archive/z.md', 'Tagged/x.md'];

	it('keeps the original order inside every band', () => {
		expect(reorder(items, getMeta, ['Projects'], ['Archive'])).toEqual([
			'Projects/b.md',
			'Projects/a.md',
			'Notes/a.md',
			'Tagged/x.md',
			'Archive/z.md',
		]);
	});

	it('returns the input unchanged when nothing matches', () => {
		expect(reorder(items, getMeta, ['Nope'], [])).toEqual(items);
	});

	it('prioritizes over deprioritizes when both match', () => {
		expect(reorder(['Tagged/x.md', 'Notes/a.md'], getMeta, ['#hot'], ['Tagged'])).toEqual([
			'Tagged/x.md',
			'Notes/a.md',
		]);
	});

	it('leaves items without metadata in the middle band', () => {
		expect(reorder(items, () => null, ['Projects'], ['Archive'])).toEqual(items);
	});
});

describe('validateEntry', () => {
	const folders = ['Projects', 'Projects/Work'];
	const tags = ['#project/active'];

	it('accepts a known folder and a known tag prefix', () => {
		expect(validateEntry('Projects/Work', folders, tags)).toBeNull();
		expect(validateEntry('#project', folders, tags)).toBeNull();
	});

	it('warns about an unknown folder', () => {
		expect(validateEntry('Nope', folders, tags)).toMatch(/No such folder/);
	});

	it('warns about an unknown tag prefix', () => {
		expect(validateEntry('#nope', folders, tags)).toMatch(/No tag/);
	});

	it('warns when a tag is missing its #', () => {
		expect(validateEntry('project#active', folders, tags)).toMatch(/must start/);
	});

	it('warns about an empty entry', () => {
		expect(validateEntry('', folders, tags)).toMatch(/Empty/);
	});
});
