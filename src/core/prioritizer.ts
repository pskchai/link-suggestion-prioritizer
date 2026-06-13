import { evaluateRule, type FileMeta } from './matching';
import type { Rule } from '../settings/types';

const LARGE = 1_000_000;

function sortKey(ruleIndex: number | null, direction: 'prioritize' | 'deprioritize' | null, n: number): number {
	if (ruleIndex === null || direction === null) return LARGE; // unmatched → middle
	if (direction === 'prioritize') return ruleIndex;           // 0 = very top
	return LARGE * 2 + (n - ruleIndex);                        // 0 = very bottom
}

export function reorder<T>(
	items: T[],
	getMeta: (item: T) => FileMeta | null,
	rules: Rule[],
): T[] {
	const n = rules.length;
	const keys = items.map(item => {
		const meta = getMeta(item);
		if (!meta) return LARGE;
		for (let i = 0; i < n; i++) {
			const rule = rules[i]!;
			if (evaluateRule(rule, meta)) return sortKey(i, rule.direction, n);
		}
		return LARGE;
	});
	const indexed = items.map((item, i) => ({ item, key: keys[i]!, orig: i }));
	indexed.sort((a, b) => a.key !== b.key ? a.key - b.key : a.orig - b.orig);
	return indexed.map(x => x.item);
}
