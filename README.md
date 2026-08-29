# Link Suggestion Prioritizer

An Obsidian plugin that reorders the `[[...]]` wikilink autocomplete suggestions by folder and tag — no change to Obsidian's fuzzy scoring, just reordering.

## Features

- **Three-band ordering**: notes you prioritize move to the top, notes you deprioritize move to the bottom, and everything else stays in the middle. Every band keeps Obsidian's original order.
- **Two match types**: a folder path, or a tag prefix (`#` prefix marks a tag).
- **Autocomplete**: the settings fields suggest the folders and tags of your vault.
- **Warnings**: the settings warn about an entry that can never match.
- **Live settings**: changes take effect immediately. No Obsidian reload is needed.
- **100% local and offline**: no network requests, no telemetry, no cloud services.

## Installation

### Manual

1. Build the plugin (`npm run build`) or download a release.
2. Copy `main.js`, `manifest.json`, and `styles.css` to `<Vault>/.obsidian/plugins/link-suggestion-prioritizer/`.
3. Reload Obsidian and enable the plugin under **Settings → Community plugins**.

### From the community plugin list

Search for **Link Suggestion Prioritizer** in **Settings → Community plugins → Browse**.

## Configuration

Open **Settings → Link Suggestion Prioritizer**.

| Setting | Description |
|---|---|
| Enable reordering | Master toggle. When off, the plugin passes all suggestions through unmodified. |
| Prioritize | Entries that move a note to the top. |
| Deprioritize | Entries that move a note to the bottom. |

Select **Add to prioritize** or **Add to deprioritize** to add an entry. Each field
autocompletes the folders and tags of your vault.

### Entry format

| Entry | Matches |
|---|---|
| `Projects` | Every note inside the `Projects` folder, at any depth. |
| `Projects/Work` | Every note inside the `Projects/Work` sub-folder. |
| `#project` | Every note with a tag that starts with `#project`, for example `#project` or `#project/active`. |

- A folder entry must be a folder. Single files are not supported.
- A tag entry must start with `#`. The match is a prefix match.
- Entries are case-insensitive.
- The order of the entries does not matter.

### Ordering semantics

```
[Prioritized, original order] … [Unmatched, original order] … [Deprioritized, original order]
```

If a note matches both lists, the prioritize list wins.

## Privacy

This plugin operates entirely within your local vault. It does not make any network requests, collect any data, or transmit anything to any service.

## Development

```bash
npm install       # install dependencies
npm run dev       # watch mode (outputs main.js)
npm run build     # production build
npm test          # unit tests (Vitest)
npm run lint      # ESLint
```

### Manual testing in a vault

```bash
cp main.js manifest.json styles.css <Vault>/.obsidian/plugins/link-suggestion-prioritizer/
```

Reload Obsidian, enable the plugin, open **Settings → Link Suggestion Prioritizer**, add an entry, and type `[[` in a note.

## Releasing

1. Bump `version` in `manifest.json` and `package.json`.
2. Add the new version → minAppVersion mapping to `versions.json`.
3. Create a GitHub release tagged with the exact version number (no leading `v`).
4. Attach `main.js`, `manifest.json`, and `styles.css` as release assets.

## License

MIT
