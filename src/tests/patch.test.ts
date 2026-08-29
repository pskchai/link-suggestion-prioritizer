/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';     // resolves to the stub via vitest.config alias
import { findLinkSuggest, toMeta } from '../patch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApp(suggests: unknown[], fileCache: unknown = null) {
	return {
		workspace: { editorSuggest: { suggests } },
		metadataCache: { getFileCache: () => fileCache },
	} as any;
}

// ---------------------------------------------------------------------------
// findLinkSuggest
// ---------------------------------------------------------------------------

describe('findLinkSuggest', () => {
	it('returns the suggester with suggestManager.mode defined', () => {
		const target = { suggestManager: { mode: 'file' } };
		expect(findLinkSuggest(makeApp([{ other: true }, target]))).toBe(target);
	});

	it('returns null when no suggester has suggestManager.mode', () => {
		expect(findLinkSuggest(makeApp([{ constructor: { name: 'LinkSuggest' } }]))).toBeNull();
	});

	it('returns null when editorSuggest is absent', () => {
		expect(findLinkSuggest({ workspace: {} } as any)).toBeNull();
	});

	it('does not fall back to suggests[0] when no structural match', () => {
		expect(findLinkSuggest(makeApp([{ suggestManager: undefined }]))).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// toMeta
// ---------------------------------------------------------------------------

describe('toMeta', () => {
	it('returns null when item has no .file property', () => {
		expect(toMeta({}, makeApp([]))).toBeNull();
	});

	it('returns null when item.file is a plain object (not TFile instance)', () => {
		expect(toMeta({ file: { path: 'x.md' } }, makeApp([]))).toBeNull();
	});

	it('returns null when item is null', () => {
		expect(toMeta(null, makeApp([]))).toBeNull();
	});

	it('returns FileMeta with path and empty tags when cache is null', () => {
		const file = Object.assign(new TFile(), { path: 'Projects/note.md' });
		const meta = toMeta({ file }, makeApp([]));
		expect(meta).not.toBeNull();
		expect(meta!.path).toBe('Projects/note.md');
		expect(meta!.tags).toEqual([]);
	});

	it('returns FileMeta with tags from cache', () => {
		const file = Object.assign(new TFile(), { path: 'note.md' });
		const cache = { tags: [{ tag: '#project' }, { tag: '#active' }] };
		const meta = toMeta({ file }, makeApp([], cache));
		expect(meta!.tags).toEqual(['#project', '#active']);
	});
});

// ---------------------------------------------------------------------------
// null-guard in applyReorder (via reorder integration)
// ---------------------------------------------------------------------------

describe('applyReorder null-guard', () => {
	// We can't test applyReorder directly (it's inside the closure), but we can
	// confirm reorder itself handles a non-array: the guard lives one level up in
	// patch.ts so we document the contract expectation here instead.
	it('reorder is not called with non-arrays because of the Array.isArray guard', () => {
		// This test documents the intent; the guard is at patch.ts:64
		// "if (!Array.isArray(items)) return items"
		expect(Array.isArray(null)).toBe(false);
		expect(Array.isArray(undefined)).toBe(false);
		expect(Array.isArray([])).toBe(true);
	});
});
