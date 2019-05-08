# Dark Mode Website Switcher <img align="right" height="200" width="200" src="src/icons/icon-dark.svg">

[![Mozilla Add-on version](https://img.shields.io/amo/v/dark-mode-website-switcher.svg)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/?src=external-github-shield-downloads)  
[![Mozilla Add-on downloads](https://img.shields.io/amo/d/dark-mode-website-switcher.svg)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/?src=external-github-shield-downloads)
[![Mozilla Add-on users](https://img.shields.io/amo/users/dark-mode-website-switcher.svg)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/statistics/)
[![Mozilla Add-on stars](https://img.shields.io/amo/stars/dark-mode-website-switcher.svg)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/reviews/)

This is a (Firefox) add-on (WebExtension) that lets you invert the website's color scheme by inverting/changing the [`prefers-color-scheme`](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-color-scheme) media feature of CSS without requiring you to chnage the whole system style setting.

Test websites:
* https://stuffandnonsense.co.uk/blog/redesigning-your-product-and-website-for-dark-mode
* https://webkit.org/
* https://pinafore.social/
* https://s.codepen.io/aardrian/debug/NmoQdN
* http://adrianroselli.com/

This extension only works with modern Firefox v67 or higher, as this is the first version that supports this feature.

## Download

**[![Get it for Firefox!](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png)](https://addons.mozilla.org/firefox/addon/dark-mode-website-switcher/?src=external-github-download)**

## Proof of concept!

Note this is more or less only a proof-of-concept and may have flaws in real-world usage.
If you just want to have dark pages (with a light system style), it will mostly™ work fine, but everything else is hardly possible. Also there may be edge-cases, where things break. (Feel free to report bugs, anyway. It's good to know what/if websites break.)
For now, I do not really consider ever having a stable release of this add-on if Firefox does not get a proper API.

The technical story on why this is so hard to overwrite CSS like that in an add-on [is described on Stackoverflow by me](https://stackoverflow.com/a/55910185/5008962), but basically I needed extract the CSS manually and manually apply it afterwards. And it requires an not-so-easy JS overwrite needed, too, BTW…

That's why I've requested a [better API on Bugzilla](https://bugzilla.mozilla.org/show_bug.cgi?id=1547818). Unless this happens, this add-on will likely never be stable and always have some things break.

## Features

* Puts your privacy first! Privacy is the default here.
* Follows the [Firefox Photon Design](https://design.firefox.com/photon).
* Has a simple, but intuitive and usable User Interface.
* Translated in several languages already. [Contribute your own language!](CONTRIBUTING.md#Translations)
* Compatible with Firefox for Android
* […]
