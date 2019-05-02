import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

/**
 * Inserts CSS.
 *
 * @private
 * @param {Object} request
 * @param {Object} sender
 * @param {function} sendResponse
 * @returns {void}
 */
function insertCss(request, sender) {
    return browser.tabs.insertCSS(sender.tab.id, {
        allFrames: true,
        code: request.css,
        matchAboutBlank: true
    }).then((...args) => {
        console.log("injection worked", args, request);
    });
}

/**
 * Deletes CSS again.
 *
 * @private
 * @param {Object} request
 * @param {Object} sender
 * @param {function} sendResponse
 * @returns {void}
 */
function removeCSS(request, sender) {
    return browser.tabs.removeCSS(sender.tab.id, {
        allFrames: true,
        code: request.css,
        matchAboutBlank: true
    }).then((...args) => {
        console.log("injection reverted (css removed)", args, request);
    });
}

// register as fast as possible
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.INSERT_CSS, insertCss);
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.REMOVE_CSS, removeCSS);
