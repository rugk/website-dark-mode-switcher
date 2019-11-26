/**
 * Applying the color's JS.
 */

"use strict";

const overwroteMatchMedia = false;

const ADDON_FAKED_WARNING = "matchMedia has been faked/overwritten by add-on website-dark-mode-switcher; see https://github.com/rugk/website-dark-mode-switcher/. If it causes any problems, please open an issue.";

/* globals COLOR_STATUS, MEDIA_QUERY_COLOR_SCHEME, MEDIA_QUERY_PREFER_COLOR, fakedColorStatus, getSystemMediaStatus */

// eslint does not include X-Ray vision functions, see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
/* globals exportFunction, cloneInto */

/**
 * Returns the COLOR_STATUS for a media query string.
 *
 * @private
 * @param {string} mediaQueryString
 * @returns {COLOR_STATUS|null}
 */
function getColorTypeFromMediaQuery(mediaQueryString) {
    // to avoid expensive RegEx, first use a simple check
    if (!mediaQueryString.includes(MEDIA_QUERY_COLOR_SCHEME)) {
        return null;
    }

    if (MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.LIGHT].test(mediaQueryString)) {
        return COLOR_STATUS.LIGHT;
    } else if (MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.DARK].test(mediaQueryString)) {
        return COLOR_STATUS.DARK;
    } else if (MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.NO_PREFERENCE]) {
        return COLOR_STATUS.NO_PREFERENCE;
    } else {
        return null;
    }
}

/**
 * Returns a fake MediaQueryList as best as possible.
 *
 * @private
 * @param {string} mediaQueryString the original media query string
 * @param {COLOR_STATUS} askedFor
 * @returns {Object} looks like MediaQueryList
 */
function fakeMediaQueryResult(mediaQueryString, askedFor) {
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

            // TODO: if we really overwrite it and not exitend it, we get the error:
            // TypeError: 'addListener' called on an object that does not implement interface MediaQueryList.
            // …because we only fake/create an object, not a real MediaQueryList
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
        console.info(
            "Real media query result: ", realColorStatus, ".",
            "We fake it to appear like: ", fakedColorStatus, ".",
            ADDON_FAKED_WARNING
        );

        // if the real status is the same as the one we fake, just go on
        // or if the whole feature is disabled, obviously
        if (fakedColorStatus === realColorStatus || fakedColorStatus === COLOR_STATUS.NO_OVERWRITE) {
            // continue evaluating real result, no need to fake it
            break;
        }

        // faking media queries is hard, and we can only a fake object
        const fakeResult = fakeMediaQueryResult(mediaQueryString, requestedMedia);
        return cloneInto(
            fakeResult,
            window,
            {cloneFunctions: true}
        );
    }
    }

    // pass to default function, by default
    return window.matchMedia(...args);
}

/**
 * Apply the JS overwrite.
 *
 * @function
 * @returns {void}
 */
function applyJsOverwrite() {
    // do not overwrite twice
    if (overwroteMatchMedia) {
        return;
    }

    // add hint for websites to detect this has been faked
    // matchMediaOverwrite.FAKED = ADDON_FAKED_WARNING;
    // DISABLED, as it could be used for tracking (which simple console statements itself cannot AFAIK)

    // actually overwrite function
    exportFunction(matchMediaOverwrite, window, {defineAs: "matchMedia"});
}

applyJsOverwrite();
