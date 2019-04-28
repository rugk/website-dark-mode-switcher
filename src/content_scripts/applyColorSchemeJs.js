/**
 * Applying the color's JS.
 */

"use strict";

const MEDIA_OVERWRITE_INDICATOR = Symbol("is overwritten");
const ADDON_FAKED_WARNING = "Media​Query​List.addListener faked by add-on website-dark-mode-switcher; https://github.com/rugk/dark-mode-website-switcher/";

let originalMatchMedia;
/* globals COLOR_STATUS, MEDIA_QUERY_PREFER_COLOR, fakedColorStatus, getSystemMediaStatus */

/**
 * Returns the COLOR_STATUS for a media query string.
 *
 * @private
 * @param {string} mediaQueryString
 * @returns {COLOR_STATUS|null}
 */
function getColorTypeFromMediaQuery(mediaQueryString) {
    switch (mediaQueryString) {
    case MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.LIGHT]:
        return COLOR_STATUS.LIGHT;
    case MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.DARK]:
        return COLOR_STATUS.DARK;
    case MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.NO_PREFERENCE]:
        return COLOR_STATUS.NO_PREFERENCE;
    default:
        return null;
    }
}
/**
 * Returns a fake MediaQueryList as best as possible.
 *
 * @private
 * @param {string} mediaQueryString the original media query string
 * @param {COLOR_STATUS} askedFor
 * @param {COLOR_STATUS} [fakedColorStatus]
 * @returns {Object} looks like MediaQueryList
 */
function fakeMediaQueryResult(mediaQueryString, askedFor, fakedColorStatus = fakedColorStatus) {
    let matches = false;

    // only return true, if the asked status is the same as the one we want to fake
    if (fakedColorStatus === askedFor) {
        matches = true;
    }

    // get some parts of real object
    const realQuery = matchMedia("(prefers-color-scheme: no-preference)");

    return {
        media: mediaQueryString,
        matches: matches,
        onchange: realQuery.onchange || null, // real value was null anyway in my tests
        addListener: (...args) => {
            console.warn(ADDON_FAKED_WARNING);

            return realQuery.addListener(...args);
        },
        removeListener: (...args) => {
            console.warn(ADDON_FAKED_WARNING);

            return realQuery.removeListener(...args);
        },
    };
}

/**
 * The actual JS overwrite for window.matchMedia().
 *
 * @function
 * @param {string} mediaQueryString
 * @returns {MediaQueryList}
 * @see {@link https://developer.mozilla.org/docs/Web/API/Window/matchMedia}
 */
function matchMediaOverwrite(...args) {
    const mediaQueryString = args[0];
    const requestedMedia = getColorTypeFromMediaQuery(mediaQueryString);

    switch (requestedMedia) {
    case COLOR_STATUS.DARK:
    case COLOR_STATUS.LIGHT:
    case COLOR_STATUS.NO_PREFERENCE: {
        const realColorStatus = getSystemMediaStatus();

        // if the real status is the same as the one we want, go on
        if (realColorStatus === requestedMedia && fakedColorStatus === realColorStatus) {
            // continue evaluating real result
            break;
        }

        // faking media queries is hard, and we can only a fake object
        return fakeMediaQueryResult(mediaQueryString, requestedMedia);
    }
    }

    // pass to default function, by default
    return originalMatchMedia(...args);
}

/**
 * Apply the JS overwrite.
 *
 * @function
 * @returns {void}
 */
function applyJsOverwrite() {
    // do not overwrite twice
    if (window.matchMedia.websiteDarkModeSwitcher === MEDIA_OVERWRITE_INDICATOR) {
        return;
    }

    originalMatchMedia = window.matchMedia;

    // actually overwrite function
    window.matchMedia = matchMediaOverwrite;

    // add indicator, so I later know that it has been overwritten
    window.matchMedia.websiteDarkModeSwitcher = MEDIA_OVERWRITE_INDICATOR;
}

applyJsOverwrite();
