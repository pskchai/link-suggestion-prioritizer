# Link Suggestion Prioritizer

An Obsidian plugin that reorders the `[[...]]` wikilink autocomplete suggestions based on configurable rules — no change to Obsidian's fuzzy scoring, just reordering.

## Features

- **Three-band ordering**: matched notes move to the top (prioritize) or bottom (deprioritize) of the list; everything else stays in Obsidian's default order.
- **Rule-based matching**: each rule combines one or more criteria with AND logic. A note is placed in the band of the first rule it matches (top rule = highest priority).
- **Three criterion types**:
  - **Path** — glob pattern matched against the note's vault path (e.g. `Projects/**`, `Daily/*`, `*.md`).
  - **Tag** — glob pattern matched against any tag on the note (frontmatter + inline, including parent tags of nested tags; e.g. `project`, `project/**`).
  - **Property** — frontmatter key check: *exists*, *equals* a value, or *contains* a value (array membership or substring).
- **Live settings**: changes take effect immediately — no Obsidian reload needed.
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

### Enable reordering

Master toggle. When off, the plugin passes all suggestions through unmodified.

### Rules

Rules are listed top-to-bottom. The first rule a note matches determines its band.

Each rule card contains:

| Field | Description |
|---|---|
| Enable toggle | Temporarily disable a rule without deleting it. |
| Name | Optional label for your own reference. |
| Direction | **Prioritize** (move to top) or **Deprioritize** (move to bottom). |
| ↑ / ↓ buttons | Reorder rules. Higher = higher priority. |
| 🗑 button | Delete the rule. |

Use the **Add criterion** button inside a rule to add criteria (combined with AND). Each criterion has a type:

- **Path** — enter a glob pattern to match the note's vault path.
  - `Projects/**` — any note inside the Projects folder.
  - `Daily/*` — direct children only (not sub-folders).
  - `**/*.md` — all markdown files.
- **Tag** — enter a glob pattern matched against the note's tags (without leading `#`).
  - `project` — exact match.
  - `project/**` — any sub-tag of project (e.g. `project/active`).
  - Patterns are case-insensitive.
- **Property** — enter a frontmatter key and select a mode:
  - *Exists* — the key is present and non-null.
  - *Equals* — the value equals the given string (numbers are coerced to string).
  - *Contains* — the value is an array that includes the given item, or a string that contains the given substring.

### Ordering semantics

```
[Rule 1 prioritized] [Rule 2 prioritized] … [Unmatched, original order] … [Rule 2 deprioritized] [Rule 1 deprioritized]
```

Within each group, notes keep Obsidian's original relative order (stable sort). Notes that match no rule are unaffected.

## Glob pattern reference

| Pattern | Matches |
|---|---|
| `**` | Any path (including slashes) |
| `*` | Any string without a slash |
| `?` | Any single character without a slash |
| `.` | A literal dot |
| All other characters | Literal match |

Patterns are anchored (full-string match) and case-insensitive.

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

Reload Obsidian, enable the plugin, open **Settings → Link Suggestion Prioritizer**, create a rule, and type `[[` in a note.

## Releasing

1. Bump `version` in `manifest.json` and `package.json`.
2. Add the new version → minAppVersion mapping to `versions.json`.
3. Create a GitHub release tagged with the exact version number (no leading `v`).
4. Attach `main.js`, `manifest.json`, and `styles.css` as release assets.

## License

MIT
