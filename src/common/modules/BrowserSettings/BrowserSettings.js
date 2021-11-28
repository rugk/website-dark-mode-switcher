/**
 * All available communication types
 *
 * @module data/BrowserSettings
 */

/**
* An array of all sources for requests.
*
* @const
* @type {Object.<string, string>}
*/
export const LEVEL_OF_CONTROL = Object.freeze({
    NOT_CONTROLLABLE: "not_controllable",
    CONTROLLED_BY_OTHER_EXTENSION: "controlled_by_other_extensions",
    CONTROLLABLE_BY_THIS_EXTENSION: "controllable_by_this_extension",
    CONTROLLED_BY_THIS_EXTENSION: "controlled_by_this_extension"
});

/**
 * The localisation strings for explaining the current level of the control.
 *
 * You can e.g. use it to explain why {@see isControllable} returns false.
 *
 * @const
 * @type {Object.<LEVEL_OF_CONTROL, string>}
 */
export const LEVEL_OF_CONTROL_EXPLANATION = Object.freeze({
    [LEVEL_OF_CONTROL.NOT_CONTROLLABLE]: "browserSettingLevelOfControlNotControllable",
    [LEVEL_OF_CONTROL.CONTROLLED_BY_OTHER_EXTENSION]: "browserSettingLevelOfControlControlledByOtherExtensions",
    [LEVEL_OF_CONTROL.CONTROLLABLE_BY_THIS_EXTENSION]: "browserSettingLevelOfControlControllableByThisExtension",
    [LEVEL_OF_CONTROL.CONTROLLED_BY_THIS_EXTENSION]: "browserSettingLevelOfControlControlledByThisExtensionExplanation"
});

/**
 * Returns whether the extension is controllable by the extension.
 *
 * @private
 * @param {LEVEL_OF_CONTROL} levelOfControl
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/types/BrowserSetting/get}
 */
 export function isControllable(levelOfControl) {
    switch (levelOfControl) {
        case LEVEL_OF_CONTROL.CONTROLLABLE_BY_THIS_EXTENSION:
        case LEVEL_OF_CONTROL.CONTROLLED_BY_THIS_EXTENSION:
        case LEVEL_OF_CONTROL.CONTROLLED_BY_OTHER_EXTENSION: // I guess we can still try to override it? https://github.com/mdn/content/issues/10838
            return true;
        case LEVEL_OF_CONTROL.NOT_CONTROLLABLE:
        case LEVEL_OF_CONTROL.CONTROLLED_BY_THIS_EXTENSION:
            return false;
        default:
            throw new TypeError(`Unexpected error: Invalid value for levelOfControl passed: ${levelOfControl}.`);
    }
 }
