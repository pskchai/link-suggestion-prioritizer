import { matchGlob } from './glob';
import type { Criterion, Rule } from '../settings/types';

export interface FileMeta {
	path: string;
	/** Tags as returned by getAllTags(): include leading '#', e.g. '#project/active' */
	tags: string[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	frontmatter: Record<string, any>;
}

export function evaluateCriterion(c: Criterion, meta: FileMeta): boolean {
	switch (c.type) {
		case 'path':
			return !!c.pattern && matchGlob(c.pattern, meta.path);

		case 'tag': {
			if (!c.pattern) return false;
			// tags include leading '#'; strip it for matching
			return meta.tags.some(t => matchGlob(c.pattern!, t.replace(/^#/, '')));
		}

		case 'property': {
			if (!c.key) return false;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const val = meta.frontmatter[c.key];
			const mode = c.mode ?? 'exists';
			if (mode === 'exists') return val !== undefined && val !== null;
			if (mode === 'equals') return String(val) === String(c.value ?? '');
			if (mode === 'contains') {
				if (Array.isArray(val)) return val.includes(c.value);
				return typeof val === 'string' && val.includes(c.value ?? '');
			}
			return false;
		}
	}
}

export function evaluateRule(rule: Rule, meta: FileMeta): boolean {
	if (!rule.enabled) return false;
	return rule.criteria.every(c => evaluateCriterion(c, meta));
}
