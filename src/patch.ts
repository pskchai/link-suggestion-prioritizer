/**
 * Monkey-patch the built-in [[ link EditorSuggest to reorder its suggestions.
 *
 * Internal API used: (app.workspace as any).editorSuggest.suggests
 * Uses monkey-around for safe stacked-patch restore (survives other plugins
 * patching the same method before or after us).
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { App, getAllTags, TFile } from 'obsidian';
import { around } from 'monkey-around';
import type { PluginSettings } from './settings';
import { reorder, type FileMeta } from './reorder';

type GetSettings = () => PluginSettings;

/**
 * Structurally detect the built-in link EditorSuggest.
 * Keyed on suggestManager.mode — a duck-type that survives minification.
 * Returns null (no silent fallback to suggests[0]) if not found.
 */
export function findLinkSuggest(app: App): any {
	const ws = app.workspace as any;
	const suggests: unknown[] | undefined = ws.editorSuggest?.suggests;
	if (!Array.isArray(suggests)) return null;
	return suggests.find((s: any) => s?.suggestManager?.mode !== undefined) ?? null;
}

/** Build a FileMeta for a suggestion item, or null if it has no backing TFile. */
export function toMeta(item: any, app: App): FileMeta | null {
	const file = item?.file;
	if (!(file instanceof TFile)) return null;
	const cache = app.metadataCache.getFileCache(file);
	return {
		path: file.path,
		tags: (cache ? getAllTags(cache) : null) ?? [],
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

	const uninstall = around(suggest, {
		getSuggestions: (original: any) => (ctx: any) => {
			const result = original.call(suggest, ctx);
			const applyReorder = (items: any) => {
				if (!Array.isArray(items)) return items;   // null-guard
				const { enabled, prioritize, deprioritize } = getSettings();
				if (!enabled || (prioritize.length === 0 && deprioritize.length === 0)) return items;
				return reorder(items, (item: any) => toMeta(item, app), prioritize, deprioritize);
			};
			if (result instanceof Promise) return result.then(applyReorder);
			return applyReorder(result);
		},
	});

	return uninstall;
}
