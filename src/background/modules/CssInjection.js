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
function insertCss(request) {
    return browser.tabs.insertCSS(request.tabId, {
        allFrames: true,
        code: request.css
    }).then((...args) => {
        console.log("injection worked", args);
    });
}

// register as fast as possible
BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.INSERT_CSS, insertCss);
