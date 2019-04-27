/**
 * Applying the color style switch.
 */

"use strict";

const PREFER_COLOR_SCHEME_MEDIA_RULE = "(prefers-color-scheme:";

/**
 * Apply the dark style.
 *
 * @function
 * @returns {void}
 */
function applyDarkStyle() {
    for (const sheet of document.styleSheets) {
        for (const cssRule of sheet.cssRules) {
            if (cssRule instanceof CSSMediaRule) {
                if (cssRule.conditionText.startsWith(PREFER_COLOR_SCHEME_MEDIA_RULE)) {
                    console.log(cssRule);
                    debugger;

                    const media = cssRule.media;
                    for (let i = 0; i < media.length; i++) {
                        switch (media[i]) {
                        case "(prefers-color-scheme: dark)":

                            // can we toggle it
                            media[i] = "(prefers-color-scheme: light)";

                            break;
                        case "(prefers-color-scheme: light)":

                            // can we toggle it
                            media[i] = "(prefers-color-scheme: dark)";

                            break;
                        default:

                        }
                    }
                }
            }
        }
    }
}

applyDarkStyle();
