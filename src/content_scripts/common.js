"use strict";

/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */

// should be set/overwritten very fast by manually registered content script
// with more settings
let functionalMode = null;
let fakedColorStatus = null;

// last setting seen by js
let jsLastColorStatus = null;

/* @see {@link https://developer.mozilla.org/docs/Web/CSS/@media/prefers-color-scheme} */
const COLOR_STATUS = Object.freeze({
    LIGHT: Symbol("prefers-color-scheme: light"),
    DARK: Symbol("prefers-color-scheme: dark"),
    NO_PREFERENCE: Symbol("prefers-color-scheme: no-preference"),
    NO_OVERWRITE: Symbol("add-on must not overwrite feature"),
});

const MEDIA_QUERY_COLOR_SCHEME = "prefers-color-scheme";

// https://regex101.com/r/vfhdz3/1
const MEDIA_QUERY_PREFER_COLOR = Object.freeze({
    [COLOR_STATUS.LIGHT]: /^\s*\(prefers-color-scheme:\s*light\)\s*$/,
    [COLOR_STATUS.DARK]: /^\s*\(prefers-color-scheme:\s*dark\)\s*$/,
    [COLOR_STATUS.NO_PREFERENCE]: /^\s*\(prefers-color-scheme:\s*no-preference\)\s*$/,
});

// request and update setting as fast as possible
browser.storage.sync.get("fakedColorStatus").then((settings) => {
    // ATTENTION: hardcoded default value here!
    const newSetting = settings.fakedColorStatus || "dark";

    fakedColorStatus = COLOR_STATUS[newSetting.toUpperCase()];
    jsLastColorStatus = fakedColorStatus;
});

/**
 * Get the real status of "prefers-color-scheme".
 *
 * @function
 * @returns {COLOR_STATUS}
 * @see {@link https://developer.mozilla.org/docs/Web/API/Window/matchMedia}
 */
function getSystemMediaStatus() {
    const prefersNothing = matchMedia("(prefers-color-scheme: no-preference)").matches;
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const prefersLight = matchMedia("(prefers-color-scheme: light)").matches;

    if (prefersNothing && !prefersDark && !prefersLight) {
        return COLOR_STATUS.NO_PREFERENCE;
    } else if (!prefersNothing && prefersDark && !prefersLight) {
        return COLOR_STATUS.DARK;
    } else if (!prefersNothing && !prefersDark && prefersLight) {
        return COLOR_STATUS.LIGHT;
    } else {
        const error = `"getSystemMediaStatus failed to get proper color status. Inconclusive results:
prefersNothing: ${prefersNothing}, prefersDark: ${prefersDark}, prefersLight: ${prefersLight}`;

        console.error(error,
            "prefersNothing", prefersNothing,
            "prefersDark", prefersDark,
            "prefersLight", prefersLight
        );
        throw new Error(error);
    }
}

/* eslint-enable no-unused-vars */
/* eslint-enable prefer-const */
