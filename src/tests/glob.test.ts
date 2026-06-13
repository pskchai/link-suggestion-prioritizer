import { describe, it, expect } from 'vitest';
import { matchGlob } from '../core/glob';

describe('matchGlob', () => {
	// ** — recursive wildcard
	it('Projects/** matches file in that folder', () => {
		expect(matchGlob('Projects/**', 'Projects/note.md')).toBe(true);
	});
	it('Projects/** matches file in nested folder', () => {
		expect(matchGlob('Projects/**', 'Projects/sub/note.md')).toBe(true);
	});
	it('Projects/** does not match sibling folder', () => {
		expect(matchGlob('Projects/**', 'Archive/note.md')).toBe(false);
	});

	// * — single-segment wildcard
	it('Daily/* matches direct child', () => {
		expect(matchGlob('Daily/*', 'Daily/2024-01-01.md')).toBe(true);
	});
	it('Daily/* does not match grandchild', () => {
		expect(matchGlob('Daily/*', 'Daily/sub/note.md')).toBe(false);
	});

	// *.md — extension filter
	it('*.md matches markdown in root', () => {
		expect(matchGlob('*.md', 'note.md')).toBe(true);
	});
	it('*.md does not match non-md file', () => {
		expect(matchGlob('*.md', 'note.txt')).toBe(false);
	});
	it('*.md does not match file in subfolder', () => {
		expect(matchGlob('*.md', 'sub/note.md')).toBe(false);
	});

	// ? — single character wildcard
	it('note? matches note1', () => {
		expect(matchGlob('note?', 'note1')).toBe(true);
	});
	it('note? does not match note12', () => {
		expect(matchGlob('note?', 'note12')).toBe(false);
	});

	// case-insensitivity
	it('is case-insensitive for path', () => {
		expect(matchGlob('projects/**', 'Projects/note.md')).toBe(true);
	});
	it('is case-insensitive for tag', () => {
		expect(matchGlob('MyTag', 'mytag')).toBe(true);
	});

	// exact match (no wildcards)
	it('exact match works', () => {
		expect(matchGlob('note.md', 'note.md')).toBe(true);
	});
	it('exact match fails on different string', () => {
		expect(matchGlob('note.md', 'other.md')).toBe(false);
	});

	// special regex characters in pattern should be safe
	it('dots in pattern are literal', () => {
		expect(matchGlob('note.md', 'noteXmd')).toBe(false);
	});
	it('parentheses in pattern are safe', () => {
		expect(matchGlob('(note)', '(note)')).toBe(true);
		expect(matchGlob('(note)', 'xnotex')).toBe(false);
	});

	// ** alone matches everything
	it('** matches any path', () => {
		expect(matchGlob('**', 'anything/goes.md')).toBe(true);
	});
});
