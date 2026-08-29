export interface FileMeta {
	path: string;
	/** Tags as returned by getAllTags(): include leading '#', e.g. '#project/active' */
	tags: string[];
}

/** An entry starting with '#' is a tag prefix; anything else is a folder path. */
export function matchesEntry(entry: string, meta: FileMeta): boolean {
	const e = entry.trim().toLowerCase();
	if (!e) return false;
	if (e.startsWith('#')) return meta.tags.some(t => t.toLowerCase().startsWith(e));
	const folder = e.replace(/\/+$/, '');
	return !!folder && meta.path.toLowerCase().startsWith(folder + '/');
}

export function matches(entries: string[], meta: FileMeta): boolean {
	return entries.some(e => matchesEntry(e, meta));
}

/**
 * Split the items into prioritized, rest, and deprioritized.
 * Each band keeps the original order of the input.
 */
export function reorder<T>(
	items: T[],
	getMeta: (item: T) => FileMeta | null,
	prioritize: string[],
	deprioritize: string[],
): T[] {
	const top: T[] = [];
	const middle: T[] = [];
	const bottom: T[] = [];
	for (const item of items) {
		const meta = getMeta(item);
		if (meta && matches(prioritize, meta)) top.push(item);
		else if (meta && matches(deprioritize, meta)) bottom.push(item);
		else middle.push(item);
	}
	return [...top, ...middle, ...bottom];
}

/** Return a warning for an entry that can never match, or null if the entry is valid. */
export function validateEntry(entry: string, folders: string[], tags: string[]): string | null {
	const e = entry.trim();
	if (!e) return 'Empty. This entry is ignored.';
	if (e.startsWith('#')) {
		const lower = e.toLowerCase();
		if (!tags.some(t => t.toLowerCase().startsWith(lower))) return 'No tag in this vault starts with this prefix.';
		return null;
	}
	if (e.includes('#')) return "A tag must start with '#'.";
	const folder = e.replace(/^\/+|\/+$/g, '').toLowerCase();
	if (!folders.some(f => f.toLowerCase() === folder)) return 'No such folder. Only folders are supported, not single files.';
	return null;
}
