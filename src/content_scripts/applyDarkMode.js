/**
 * Applying the color style switch.
 */

"use strict";

// tab ID is injected by background script (CssAnalysis)
/* globals MY_TAB_ID */

const PREFER_COLOR_DARK = "(prefers-color-scheme: dark)";
const PREFER_COLOR_LIGHT = "(prefers-color-scheme: light)";

const COMMUNICATE_INSERT_CSS = "insertCss";

// need to save injected CSS, so we can remove it later
let injectedCss = "";

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
                if (cssRule.conditionText === queryString) {
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
function getCssForMediaQuery(queryString) {
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
                if (cssRule.conditionText === queryString) {
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
 * @function
 * @returns {void}
 */
function applyDarkStyle() {
    const darkCss = getCssForMediaQueryFunc(PREFER_COLOR_DARK);

    // ignore, if no CSS is specified
    if (!darkCss) {
        return;
    }

    console.log("got dark CSS", darkCss);

    browser.runtime.sendMessage({
        type: COMMUNICATE_INSERT_CSS,
        css: darkCss,
        tabId: MY_TAB_ID
    }).then((...args) => {
        console.log("CSS message injected", args);

        injectedCss = darkCss;
    });
}

applyDarkStyle();
