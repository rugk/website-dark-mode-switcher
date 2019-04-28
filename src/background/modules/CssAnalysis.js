const TAB_FILTER_URLS = ["http://*/*", "https://*/*"];

/**
 * Inserts content script.
 *
 * @private
 * @param {Object} tab
 * @returns {void}
 */
async function insertContentScriptFast(tab) {
    // first inject pointer to let content script know in which tab
    // it is running
    await browser.tabs.executeScript(tab.id, {
        code: `const MY_TAB_ID = ${tab.id}`,
        allFrames: true,
        runAt: "document_start"
    });

    await browser.tabs.executeScript(tab.id, {
        file: "/content_scripts/common.js",
        allFrames: true,
        runAt: "document_start"
    });

    return browser.tabs.executeScript(tab.id, {
        file: "/content_scripts/applyColorSchemeJs.js",
        allFrames: true,
        runAt: "document_start"
    });
}
/**
 * Inserts content script.
 *
 * @private
 * @param {Object} tab
 * @returns {void}
 */
function insertContentScriptLate(tab) {
    return browser.tabs.executeScript(tab.id, {
        file: "/content_scripts/applyColorSchemeCss.js",
        allFrames: true,
        runAt: "document_idle"
    });
}

/**
 * Init module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    // inject in all tabs that we have permission for
    browser.tabs.query({
        url: TAB_FILTER_URLS
    }).then((tabs) => {
        return Promise.all(tabs.map((tab) => {
            return insertContentScriptFast(tab).then(() => {
                return insertContentScriptFast(tab);
            });
        }));
    }).then(() => {
        console.log("inserted content script into all pages");
    }).catch(console.error);

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
        if ("url" in changeInfo) {
            console.log("insert insertContentScriptFast");
            return insertContentScriptFast(tabInfo);
        } else if (changeInfo.status === "complete") {
            console.log("insert insertContentScriptLate now that status is complete");
            return insertContentScriptLate(tabInfo);
        }
        return Promise.reject(new Error("not a completed tab load, ignoring it"));
    }, {
        urls: TAB_FILTER_URLS
    }).then(() => {
        console.log("inserted content script into newly created tab");
    });
}
