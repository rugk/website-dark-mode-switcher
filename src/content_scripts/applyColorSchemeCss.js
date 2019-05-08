/**
 * Applying the color style switch.
 */

"use strict";

// from commons.js
/* globals COLOR_STATUS, MEDIA_QUERY_PREFER_COLOR, fakedColorStatus */

const COMMUNICATE_INSERT_CSS = "insertCss";
const COMMUNICATE_REMOVE_CSS = "removeCss";

// need to save injected CSS, so we can remove it later
let injectedCss = "";

/**
 * Filter a media query and discard irrelevant elements for our use case.
 *
 * E.g.:
 * screen and (prefers-color-scheme: dark)
 *
 * @private
 * @param {string} queryCondition
 * @returns {string}
 */
function filterMediaQueryCond(queryCondition) {
    const SPLITTER = [" and "];
    const IGNORED_QUERIES = [
        "screen", // obviously, we are on a screen
        "all"
    ];

    let splitString;
    SPLITTER.forEach((split) => {
        splitString = queryCondition.split(split);

        splitString = splitString.filter((element) => {
            // also ignore useless "only" at beginning
            if (element.startsWith("only ")) {
                element = element.splice(5);
            }

            return !IGNORED_QUERIES.includes(element);
        });

        splitString = splitString.join(split);
    });

    return splitString;
}

/**
 * Return CSS from the website for a specific query string.
 *
 * (functional implementation)
 *
 * @private
 * @param {string} queryString
 * @returns {string}
 */
function getCssForMediaQueryFunc(queryString) {
    return Array.from(document.styleSheets).reduce((prev, styleSheet) => {
        /* workaround for crazy HTML spec throwing an SecurityError here,
         * see https://discourse.mozilla.org/t/accessing-some-fonts-css-style-sheet-via-stylesheet/38717?u=rugkx
         * and https://stackoverflow.com/questions/21642277/security-error-the-operation-is-insecure-in-firefox-document-stylesheets */
        try {
            styleSheet.cssRules; // eslint-disable-line no-unused-expressions
        } catch (e) {
            return prev;
        }

        return Array.from(styleSheet.cssRules).reduce((prev, cssRule) => {
            if (cssRule instanceof CSSMediaRule) {
                const conditionQuery = cssRule.conditionText;

                if (conditionQuery.includes(queryString) && // to avoid fast splitting/parsing, first check whether there is even a chance
                    filterMediaQueryCond(conditionQuery) === queryString // check, whether we can take this query
                ) {
                    return Array.from(cssRule.cssRules).reduce((prev, subCssRule) => {
                        return prev + subCssRule.cssText;
                    }, prev);
                }
            }
            return prev;
        }, prev);
    }, "");
}

/**
 * Return CSS from the website for a specific query string.
 *
 * @private
 * @param {string} queryString
 * @returns {string}
 */
function getCssForMediaQuery(queryString) { // eslint-disable-line no-unused-vars
    let cssRules = "";
    for (const styleSheet of document.styleSheets) {
        /* workaround for crazy HTML spec throwing an SecurityError here,
         * see https://discourse.mozilla.org/t/accessing-some-fonts-css-style-sheet-via-stylesheet/38717?u=rugkx
         * and https://stackoverflow.com/questions/21642277/security-error-the-operation-is-insecure-in-firefox-document-stylesheets */
        try {
            styleSheet.cssRules; // eslint-disable-line no-unused-expressions
        } catch (e) {
            continue;
        }

        for (const cssRule of styleSheet.cssRules) {
            if (cssRule instanceof CSSMediaRule) {
                if (filterMediaQueryCond(cssRule.conditionText) === queryString) {
                    for (const subCssRule of cssRule.cssRules) {
                        cssRules = cssRules + subCssRule.cssText;
                    }
                }
            }
        }
    }
    return cssRules;
}

/**
 * Apply the dark style.
 *
 * Will be triggered manually via injected content script or
 * "newSetting" message. (see updateRequest.js).
 *
 * @function
 * @returns {void}
 */
async function applyWantedStyle() { // eslint-disable-line no-unused-vars
    // if something is already injected, remove it first
    if (injectedCss) {
        await browser.runtime.sendMessage({
            type: COMMUNICATE_REMOVE_CSS,
            css: injectedCss
        }).then((...args) => {
            console.log("old CSS removed", args);

            injectedCss = "";
        });
    }

    if (fakedColorStatus === COLOR_STATUS.NO_OVERWRITE) {
        // well, do nothing
        return;
    }

    const wantedMediaQuery = MEDIA_QUERY_PREFER_COLOR[fakedColorStatus];
    const wantedCss = getCssForMediaQueryFunc(wantedMediaQuery);

    // ignore, if no CSS is specified
    if (!wantedCss) {
        return;
    }

    console.log("for status", fakedColorStatus,
        ", with media query", wantedMediaQuery,
        ", we've got:", wantedCss
    );

    browser.runtime.sendMessage({
        type: COMMUNICATE_INSERT_CSS,
        css: wantedCss
    }).then((...args) => {
        console.log("CSS message injected", args);

        injectedCss = wantedCss;
    });
}

// apply style when DOM content is loaded
document.addEventListener("DOMContentLoaded", applyWantedStyle);
