/**
 * All available communication types
 *
 * @module data/browserCommunicationTypes
 */

/**
 * An array of all communcation types.
 *
 * @const
 * @type {Object.<string, string>}
 */
export const COMMUNICATION_MESSAGE_TYPE = Object.freeze({
    INSERT_CSS: "insertCss",
    REMOVE_CSS: "removeCss",
    NEW_SETTING: "newSetting",
    NEW_ADDIONAL_SETTINGS: "newSettingAdditional"
});

/**
* An array of all sources for requests.
*
* @const
* @type {Object.<string, string>}
*/
export const COMMUNICATION_MESSAGE_SOURCE = Object.freeze({
    BROWSER_ACTION: "browserAction",
    SETTINGS_PAGE: "settingsPage"
});
