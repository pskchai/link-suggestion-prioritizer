/** Minimal Obsidian stub for unit tests. Only the symbols needed by patch.ts. */

export class TFile {
	path = '';
	constructor(path?: string) { if (path) this.path = path; }
}

export function getAllTags(cache: unknown): string[] | null {
	const c = cache as { tags?: Array<{ tag: string }> } | null;
	return c?.tags?.map(t => t.tag) ?? null;
}

export class App {}
export class Plugin {}
export class PluginSettingTab {}
export class Setting {}
