/**
 * Applying the color style switch.
 */

"use strict";

/**
 * Apply the dark style.
 *
 * @function
 * @returns {void}
 */
function applyDarkStyle() {
    // debugger;
    const darkMediaStyle = Array.from(document.styleSheets).reduce((prev, styleSheet) => {
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
                switch (cssRule.conditionText) {
                case "(prefers-color-scheme: dark)":
                case "(prefers-color-scheme: light)":
                    return Array.from(cssRule.cssRules).reduce((prev, subCssRule) => {
                        return prev + subCssRule.cssText;
                    }, prev);
                }
            }
            return prev;
        }, prev);
    }, "");
    debugger;

    let cssRules;
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
                switch (cssRule.conditionText) {
                case "(prefers-color-scheme: dark)":
                case "(prefers-color-scheme: light)":
                    for (const subCssRule of cssRule.cssRules) {
                        cssRules = cssRules + subCssRule.cssText;
                    }
                }
            }
        }
    }
    debugger;
}

applyDarkStyle();
