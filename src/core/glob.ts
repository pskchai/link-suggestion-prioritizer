/**
 * Convert a glob pattern to a RegExp.
 * Supported wildcards: ** (any path segments), * (one segment, no /), ? (one non-/ char).
 * Match is full-string, case-insensitive.
 */
export function globToRegExp(pattern: string): RegExp {
	let re = '';
	let i = 0;
	while (i < pattern.length) {
		if (pattern[i] === '*' && pattern[i + 1] === '*') {
			re += '.*';
			i += 2;
			// skip optional surrounding slashes
			if (pattern[i] === '/') i++;
		} else if (pattern[i] === '*') {
			re += '[^/]*';
			i++;
		} else if (pattern[i] === '?') {
			re += '[^/]';
			i++;
		} else {
			// escape regex special characters
			re += pattern[i]!.replace(/[.+^${}()|[\]\\]/g, '\\$&');
			i++;
		}
	}
	return new RegExp(`^${re}$`, 'i');
}

export function matchGlob(pattern: string, value: string): boolean {
	return globToRegExp(pattern).test(value);
}
