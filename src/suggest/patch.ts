/**
 * Monkey-patch the built-in [[ link EditorSuggest to reorder its suggestions.
 *
 * Internal API used: (app.workspace as any).editorSuggest.suggests
 * This is the established community pattern — e.g. headings-in-wikilink-suggestions,
 * obsidian-focus. The patch is instance-level and fully restored on unload.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { App, getAllTags, TFile } from 'obsidian';
import type { Rule } from '../settings/types';
import type { FileMeta } from '../core/matching';
import { reorder } from '../core/prioritizer';

type GetSettings = () => { enabled: boolean; rules: Rule[] };

/** Feature-detect the built-in link/file EditorSuggest instance. */
function findLinkSuggest(app: App): any {
	const ws = app.workspace as any;
	const suggests: unknown[] | undefined = ws.editorSuggest?.suggests;
	if (!Array.isArray(suggests)) return null;
	return (
		suggests.find((s: any) => /link|file/i.test(String(s?.constructor?.name ?? ''))) ??
		suggests[0] ??
		null
	);
}

/** Build a FileMeta for a suggestion item, or null if it has no backing TFile. */
function toMeta(item: any, app: App): FileMeta | null {
	const file = item?.file;
	if (!(file instanceof TFile)) return null;
	const cache = app.metadataCache.getFileCache(file);
	return {
		path: file.path,
		tags: (cache ? getAllTags(cache) : null) ?? [],
		frontmatter: (cache?.frontmatter as Record<string, any>) ?? {},
	};
}

/**
 * Install the patch. Returns a restore function — pass to plugin.register().
 * Call after app.workspace.onLayoutReady().
 */
export function installPatch(app: App, getSettings: GetSettings): () => void {
	const suggest: any = findLinkSuggest(app);
	if (!suggest) {
		console.warn('[link-suggestion-prioritizer] Could not locate the built-in link suggester; ordering is disabled.');
		return () => { /* no-op */ };
	}

	const original = suggest.getSuggestions.bind(suggest);

	const applyReorder = (items: any[]) => {
		const settings = getSettings();
		if (!settings.enabled || settings.rules.length === 0) return items;
		return reorder(items, (item: any) => toMeta(item, app), settings.rules);
	};

	suggest.getSuggestions = (ctx: any) => {
		const result = original(ctx);
		if (result instanceof Promise) return result.then(applyReorder);
		return applyReorder(result);
	};

	return () => {
		suggest.getSuggestions = original;
	};
}
