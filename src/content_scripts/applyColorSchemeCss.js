/**
 * Applying the color style switch.
 */

"use strict";

// from commons.js
/* globals COLOR_STATUS, MEDIA_QUERY_COLOR_SCHEME, MEDIA_QUERY_PREFER_COLOR */
// settings injection
/* globals fakedColorStatus, functionalMode */

const COMMUNICATE_INSERT_CSS = "insertCss";
const COMMUNICATE_REMOVE_CSS = "removeCss";

// need to save injected CSS, so we can remove it later
let injectedCss = "";
// placeholder variable for if the style has failed
let applyStyleFailed = false;

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
 * @param {RegEx} queryString
 * @param {StyleSheet} [stylesheet=document.styleSheets] add a custom StyleSheet if you want to parse a different one
 * @param {string} [previousText]
 * @returns {string}
 */
function getCssForMediaQueryFunc(queryString, stylesheet = document.styleSheets, previousText = "") {
    return Array.from(stylesheet).reduce((previousText, styleSheet) => {
        return Array.from(styleSheet.cssRules).reduce((previousText, cssRule) => {
            return parseCssMediaRuleFunc(cssRule, queryString, previousText);
        }, previousText);
    }, previousText);
}

/**
 * Parses one single CSS media rule and looks for.
 *
 * (functional implementation)
 *
 * @private
 * @param {CSSMediaRule} cssRule
 * @param {string} queryString
 * @param {string} previousText
 * @returns {string}
 */
function parseCssMediaRuleFunc(cssRule, queryString, previousText) {
    // recursively import/iterate imported stylesheets
    if (cssRule instanceof CSSImportRule) {
        return getCssForMediaQueryFunc(queryString, [ cssRule.styleSheet ], previousText);
    }
    if (!(cssRule instanceof CSSMediaRule)) {
        return previousText;
    }

    // evaluate "usual" CSS conditions
    const conditionQuery = cssRule.conditionText;

    if (conditionQuery.includes(MEDIA_QUERY_COLOR_SCHEME) && // to avoid fast splitting/parsing, first check whether there is even a chance this has to do anything with what we want
        queryString.test(filterMediaQueryCond(conditionQuery)) // check, whether we can take this query
    ) {
        return Array.from(cssRule.cssRules).reduce((previousText, subCssRule) => {
            return previousText + subCssRule.cssText;
        }, previousText);
    }
    return previousText;
}

/**
 * Return CSS from the website for a specific query string.
 *
 * @private
 * @param {string} queryString
 * @param {StyleSheet} [stylesheet=document.styleSheets] add a custom StyleSheet if you want to parse a different one
 * @returns {string}
 */
function getCssForMediaQuery(queryString, stylesheet = document.styleSheets) {
    let cssRules = "";
    for (const styleSheet of stylesheet) {
        /* workaround for crazy HTML spec throwing an SecurityError here,
         * see https://discourse.mozilla.org/t/accessing-some-fonts-css-style-sheet-via-stylesheet/38717?u=rugkx
         * and https://stackoverflow.com/questions/21642277/security-error-the-operation-is-insecure-in-firefox-document-stylesheets */
        try {
            styleSheet.cssRules; // eslint-disable-line no-unused-expressions
        } catch (e) {
            continue;
        }

        for (const cssRule of styleSheet.cssRules) {
            cssRules += parseCssMediaRule(cssRule, queryString);
        }
    }
    return cssRules;
}

/**
 * Parses one single CSS media rule and looks for the given query string.
 *
 * @private
 * @param {CSSMediaRule} cssRule
 * @param {string} queryString
 * @returns {string}
 */
function parseCssMediaRule(cssRule, queryString) {
    // recursively import/iterate imported stylesheets
    if (cssRule instanceof CSSImportRule) {
        return getCssForMediaQuery(queryString, [ cssRule.styleSheet ]);
    }
    if (!(cssRule instanceof CSSMediaRule)) {
        return "";
    }
    let cssRules = "";

    // evaluate "usual" CSS conditions
    const conditionQuery = cssRule.conditionText;

    if (conditionQuery.includes(MEDIA_QUERY_COLOR_SCHEME) && // to avoid slow splitting/parsing, first check whether there is even a chance this has to do anything with what we want
        queryString.test(filterMediaQueryCond(conditionQuery)) // check, whether we can take this query
    ) {
        for (const subCssRule of cssRule.cssRules) {
            cssRules += subCssRule.cssText;
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
            console.info("website-dark-mode-switcher: old CSS removed", args);

            injectedCss = "";
        });
    }

    if (fakedColorStatus === COLOR_STATUS.NO_OVERWRITE) {
        // well, do nothing
        return;
    }

    const wantedMediaQuery = MEDIA_QUERY_PREFER_COLOR[fakedColorStatus];
    let wantedCss;
    if (functionalMode) {
        wantedCss = getCssForMediaQueryFunc(wantedMediaQuery);
    } else {
        wantedCss = getCssForMediaQuery(wantedMediaQuery);
    }

    // ignore, if no CSS is specified
    if (!wantedCss) {
        applyStyleFailed = true;
        return;
    }

    console.info("website-dark-mode-switcher applied custom CSS; for status", fakedColorStatus,
        ", with media query", wantedMediaQuery,
        ", we've got:", wantedCss
    );

    browser.runtime.sendMessage({
        type: COMMUNICATE_INSERT_CSS,
        css: wantedCss
    }).then(() => {
        injectedCss = wantedCss;
    });
}

/**
 * Apply style again if it has failed.
 *
 * Will be triggered on document load if the initial
 * DOMContentLoad fails.
 *
 * @function
 * @returns {void}
 */
function applyStyleOnFail() {
    if (applyStyleFailed) {
        applyWantedStyle();
    }
}

// apply style when DOM content is loaded
document.addEventListener("DOMContentLoaded", applyWantedStyle);
// apply style when content is fully loaded
window.addEventListener("load", applyStyleOnFail);
