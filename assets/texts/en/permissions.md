# Requested permissions

For a general explanation of add-on permission see [this support article](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Installation permissions

| Internal Id  | Permission                        | Explanation                                                   |
|:-------------|:----------------------------------|:--------------------------------------------------------------|
| `<all_urls>` | Access your data for all websites | Needed injecting the new (dark) style into tabs.              |
| `tabs`       | Access browser tabs               | Needed injecting the new (dark) style into all existing tabs. |

## Hidden permissions

Additionally, it requests these permissions, which are not requested in Firefox when the add-on is installed, as they are not a serious permission.

| Internal Id  | Permission                        | Explanation                                      |
|:-------------|:----------------------------------|:-------------------------------------------------|
| `storage`    | Access local storage              | Needed for saving options                        |
