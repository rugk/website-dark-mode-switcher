/**
 * Applying the color's JS.
 */

"use strict";

let overwroteMatchMedia = false;

const ADDON_FAKED_WARNING = "MediaQueryList has been faked by add-on website-dark-mode-switcher; see https://github.com/rugk/website-dark-mode-switcher/. If it causes any problems, please open an issue.";
let loggedFakedWarning = false;

// instances of `MediaQueryList`s with listeners
const setMediaQueryLists = new Set();

// func -> { hook, setMediaQueryList, setMediaQueryListOnChange }
const wmFuncToEntry = new WeakMap();

// hook -> func
const wmHookToFunc = new WeakMap();

const privilegedOnChangeGetter = Reflect.getOwnPropertyDescriptor(MediaQueryList.prototype, 'onchange').get;

const MediaQueryListPrototype = MediaQueryList.prototype.wrappedJSObject;
const originalAddListener = MediaQueryListPrototype.addListener;
const originalRemoveListener = MediaQueryListPrototype.removeListener;
const originalMatchesGetter = Reflect.getOwnPropertyDescriptor(MediaQueryListPrototype, 'matches').get;
const originalOnChangeGetter = Reflect.getOwnPropertyDescriptor(MediaQueryListPrototype, 'onchange').get;
const originalOnChangeSetter = Reflect.getOwnPropertyDescriptor(MediaQueryListPrototype, 'onchange').set;

const EventTargetPrototype = window.EventTarget.prototype.wrappedJSObject;
const originalAddEventListener = EventTargetPrototype.addEventListener;
const originalRemoveEventListener = EventTargetPrototype.removeEventListener;

// ugly juggling principals
const unsafeObjectCreate = window.wrappedJSObject.Object.create;

// Whether we are dispatching "change" events
let dispatching = false;

/* globals COLOR_STATUS, MEDIA_QUERY_COLOR_SCHEME, MEDIA_QUERY_PREFER_COLOR, fakedColorStatus, getSystemMediaStatus, jsLastColorStatus */

// eslint does not include X-Ray vision functions, see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts
/* globals exportFunction */

/**
 * Returns the COLOR_STATUS for a media query string.
 *
 * @private
 * @param {string} mediaQueryString
 * @returns {COLOR_STATUS|null}
 */
function getColorTypeFromMediaQuery(mediaQueryString) {
    // to avoid expensive RegEx, first use a simple check
    if (!hasColorMediaQuery(mediaQueryString)) {
        return null;
    }

    if (MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.LIGHT].test(mediaQueryString)) {
        return COLOR_STATUS.LIGHT;
    } else if (MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.DARK].test(mediaQueryString)) {
        return COLOR_STATUS.DARK;
    } else if (MEDIA_QUERY_PREFER_COLOR[COLOR_STATUS.NO_PREFERENCE].test(mediaQueryString)) {
        return COLOR_STATUS.NO_PREFERENCE;
    } else {
        return null;
    }
}

/**
 * Whether a string contains media query for color scheme
 *
 * @private
 * @param {string} mediaQueryString
 * @returns {boolean}
 */
function hasColorMediaQuery(mediaQueryString) {
    return (mediaQueryString.includes(MEDIA_QUERY_COLOR_SCHEME));
}

/**
 * Evaluate a media query string.
 * Returns null if the query has nothing to do with color.
 *
 * @private
 * @param {string} mediaQueryString
 * @returns {boolean|null}
 */
function evaluateMediaQuery(mediaQueryString) {
    if (fakedColorStatus === COLOR_STATUS.NO_OVERWRITE) {
        return matchMedia(mediaQueryString).matches;
    }

    let requestedMedia = getColorTypeFromMediaQuery(mediaQueryString);
    if (requestedMedia === null) {
        return null;
    }

    return (fakedColorStatus === requestedMedia);
}

/**
 * Keep track of listener addition
 * Creates hook function if necessary
 *
 * @private
 * @param {function} func original listener
 * @param {MediaQueryList} mediaQueryList
 * @param {boolean} isOnChange
 * @returns {function} hook
 */
function trackOnListener(func, mediaQueryList, isOnChange) {
    let entry = wmFuncToEntry.get(func);

    let hook, setMediaQueryList, setMediaQueryListOnChange;
    if (!entry) {
        hook = makeListenerHook(func);
        setMediaQueryList = new Set();
        setMediaQueryListOnChange = new Set();
        wmFuncToEntry.set(func, { hook, setMediaQueryList, setMediaQueryListOnChange });
        wmHookToFunc.set(hook, func);
    } else {
        ({ hook, setMediaQueryList, setMediaQueryListOnChange } = entry);
    }

    if (isOnChange) {
        setMediaQueryListOnChange.add(mediaQueryList);
    } else {
        setMediaQueryList.add(mediaQueryList);
    }

    setMediaQueryLists.add(mediaQueryList);

    return hook;
}

/**
 * Keep track of listener removal
 * Returns hook function or null if not found
 *
 * @private
 * @param {function} func original listener
 * @param {MediaQueryList} mediaQueryList
 * @param {boolean} isOnChange
 * @returns {function} hook
 */
function trackOffListener(func, mediaQueryList, isOnChange) {
    let entry = wmFuncToEntry.get(func);
    if (!entry) {
        return null;
    }
    let { hook, setMediaQueryList, setMediaQueryListOnChange } = entry;

    if (isOnChange) {
        setMediaQueryListOnChange.delete(mediaQueryList);
    } else {
        setMediaQueryList.delete(mediaQueryList);
    }

    if (setMediaQueryList.size === 0 && setMediaQueryListOnChange.size === 0) {
        setMediaQueryLists.delete(mediaQueryList);
    }

    return hook;
}

/**
 * Check if an object is a MediaQueryList
 * The correctness of this relies on Firefox's XPCNativeWrapper
 *
 * @private
 * @param {function} obj
 * @returns {boolean}
 */
function checkIsMediaQueryList(obj) {
    return (Object.prototype.toString.call(obj) === '[object MediaQueryList]');
}

const skeleton = {
    addListener(func) {
        if (!checkIsMediaQueryList(this) ||
            typeof func !== 'function' ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalAddListener, this, arguments);
        }
        let hook = trackOnListener(func, this, false);
        return Reflect.apply(originalAddListener, this, [hook]);
    },
    removeListener(func) {
        if (!checkIsMediaQueryList(this) ||
            typeof func !== 'function' ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalRemoveListener, this, arguments);
        }
        let hook = trackOffListener(func, this, false);
        if (!hook) {
            return Reflect.apply(originalRemoveListener, this, arguments);
        }
        return Reflect.apply(originalRemoveListener, this, [hook]);
    },
    get matches() {
        if (!checkIsMediaQueryList(this) ||
            fakedColorStatus === COLOR_STATUS.NO_OVERWRITE
        ) {
            return Reflect.apply(originalMatchesGetter, this, arguments);
        }
        let result = evaluateMediaQuery(this.media);
        if (result === null) {
            return Reflect.apply(originalMatchesGetter, this, arguments);
        }
        mayLogFakeWarning();
        return result;
    },
    get onchange() {
        if (!checkIsMediaQueryList(this) ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalOnChangeGetter, this, arguments);
        }
        let hook = Reflect.apply(privilegedOnChangeGetter, this, arguments);
        if (typeof hook !== 'function') {
            return hook;
        }
        let func = wmHookToFunc.get(hook);
        if (typeof func !== 'function') {
            console.error('[website-dark-mode-switcher] someone called "get onchange" on an unknown MediaQueryList!');
            return null;
        }
        return func;
    },
    set onchange(func) {
        if (!checkIsMediaQueryList(this) ||
            typeof func !== 'function' ||
            !hasColorMediaQuery(this.media)
        ) {
            // eslint-disable-next-line no-setter-return
            return Reflect.apply(originalOnChangeSetter, this, arguments);
        }
        let oldHook = Reflect.apply(privilegedOnChangeGetter, this, arguments);
        if (typeof oldHook === 'function') {
            let oldFunc = wmHookToFunc.get(oldHook);
            if (typeof oldFunc !== 'function') {
                console.error('[website-dark-mode-switcher] someone called "set onchange" on an unknown MediaQueryList!');
                // eslint-disable-next-line no-setter-return
                return Reflect.apply(originalOnChangeSetter, this, arguments);
            }
            trackOffListener(oldFunc, this, true);
        }
        let hook = trackOnListener(func, this, true);
        // eslint-disable-next-line no-setter-return
        return Reflect.apply(originalOnChangeSetter, this, [hook]);
    },

    addEventListener(type, listener, options) {
        if (!checkIsMediaQueryList(this) ||
            type !== 'change' ||
            typeof listener !== 'function' ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalAddEventListener, this, arguments);
        }
        let hook = trackOnListener(listener, this, false);
        return Reflect.apply(originalAddEventListener, this, ['change', hook, options]);
    },
    removeEventListener(type, listener, options) {
        if (!checkIsMediaQueryList(this) ||
            type !== 'change' ||
            typeof listener !== 'function' ||
            !hasColorMediaQuery(this.media)
        ) {
            return Reflect.apply(originalRemoveEventListener, this, arguments);
        }
        let hook = trackOffListener(listener, this, false);
        if (!hook) {
            return Reflect.apply(originalRemoveEventListener, this, arguments);
        }
        return Reflect.apply(originalRemoveEventListener, this, ['change', hook, options]);
    }
};

/**
 * Make a hook function for "change" event listener
 *
 * @private
 * @param {function} func the original listener function
 * @returns {function}
 */
function makeListenerHook(func) {
    let dummy = unsafeObjectCreate(null);
    return exportFunction(function(event) {
        if (Object.prototype.toString.call(event) !== '[object MediaQueryListEvent]' ||
            fakedColorStatus === COLOR_STATUS.NO_OVERWRITE
        ) {
            return Function.prototype.apply.call(func, this, arguments);
        }

        if (!dispatching && event.isTrusted) {
            // swallow events originating from the browser
            mayLogFakeWarning();
            return;
        }

        return Function.prototype.apply.call(func, this, arguments);
    }, dummy, {
        defineAs: func.name
    });
}

/**
 * Dispatch artificial "change" events
 *
 * @private
 */
function dispatchChangeEvents() {
    if (fakedColorStatus === COLOR_STATUS.NO_OVERWRITE &&
        jsLastColorStatus === getSystemMediaStatus()
    ) {
        return;
    }

    // [CAVEAT]
    // In vanilla Firefox, events are dispatched to `MediaQueryList`s in the order they are created.
    // Since there is no way to keep track of the order of all `MediaQueryList`s without memory leaks,
    // we are calling them in the order they are assigned listeners.
    dispatching = true;
    for (let mediaQueryList of setMediaQueryLists) {
        let result = evaluateMediaQuery(mediaQueryList.media);
        if (result === null) {
            continue;
        }
        mayLogFakeWarning();
        // [CAVEAT]
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1348213
        // WebExtensions have no way of generating trusted events
        let event = new MediaQueryListEvent('change', {
            media: mediaQueryList.media,
            matches: result
        });
        mediaQueryList.dispatchEvent(event);
    }
    dispatching = false;
}

/**
 * Apply the JS overwrite.
 *
 * @function
 * @returns {void}
 */
function applyJsOverwrite() {
    // do not overwrite twice
    if (overwroteMatchMedia) {
        dispatchChangeEvents();
        return;
    }

    // eslint-disable-next-line no-global-assign
    jsLastColorStatus = fakedColorStatus;

    // actually overwrite

    Reflect.defineProperty(MediaQueryListPrototype, 'addListener', {
        configurable: true,
        enumerable: true,
        value: exportFunction(skeleton.addListener, window),
        writable: true
    });
    Reflect.defineProperty(MediaQueryListPrototype, 'removeListener', {
        configurable: true,
        enumerable: true,
        value: exportFunction(skeleton.removeListener, window),
        writable: true
    });
    let descriptorMatches = Reflect.getOwnPropertyDescriptor(skeleton, 'matches');
    Reflect.defineProperty(MediaQueryListPrototype, 'matches', {
        configurable: true,
        enumerable: true,
        get: exportFunction(descriptorMatches.get, window)
    });
    let descriptorOnchange = Reflect.getOwnPropertyDescriptor(skeleton, 'onchange');
    Reflect.defineProperty(MediaQueryListPrototype, 'onchange', {
        configurable: true,
        enumerable: true,
        get: exportFunction(descriptorOnchange.get, window),
        set: exportFunction(descriptorOnchange.set, window),
    });

    Reflect.defineProperty(EventTargetPrototype, 'addEventListener', {
        configurable: true,
        enumerable: true,
        value: exportFunction(skeleton.addEventListener, window),
        writable: true
    });
    Reflect.defineProperty(EventTargetPrototype, 'removeEventListener', {
        configurable: true,
        enumerable: true,
        value: exportFunction(skeleton.removeEventListener, window),
        writable: true
    });

    overwroteMatchMedia = true;
}

applyJsOverwrite();

/**
 * Logs ADDON_FAKED_WARNING if not already did
 */
function mayLogFakeWarning() {
    if (!loggedFakedWarning) {
        console.log(ADDON_FAKED_WARNING);
        loggedFakedWarning = true;
    }
}
