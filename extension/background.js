var isPlaying;
var isPlaylist = false;
var tabId;

var ytRegex = /https:\/\/(?:[^\/]+\.)?youtube\.com\/watch.*?(?:\&|\?)list=[^&\s]+/;
var port;
var minLength = 2;

async function handleYoutube() {
    isPlaying = await browser.scripting
        .executeScript({
            target: { tabId: tabId },
            func: () => {
                if (!document.querySelector('video[class*="video-stream html5-main-video"]').paused) {
                    setTimeout(() => {
                        browser.runtime.sendMessage("video_playing");
                    }, 1000);
                    return true;
                }
                return false;
            },
        })
        .then((ret) => ret[0].result);

    await browser.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            let video = document.querySelector('video[class*="video-stream html5-main-video"]');
            video.onpause = () => {
                browser.runtime.sendMessage("video_paused");
            };
            video.onplaying = () => {
                // give a second in case of loading
                setTimeout(() => {
                    browser.runtime.sendMessage("video_playing");
                }, 1000);
            };
        },
    });
}

function handleCreate(tab) {
    if (isPlaylist && isPlaying) return;

    browser.tabs.get(tab.id).then(async (tab) => {
        if (tab.url.match(ytRegex)) {
            isPlaylist = true;
            tabId = tab.id;
            handleYoutube();
        }
    });
}

async function handleUpdate(id) {
    if (isPlaylist && isPlaying) return;

    browser.tabs.get(id).then(async (tab) => {
        if (tab.url.match(ytRegex)) {
            isPlaylist = true;
            tabId = tab.id;
            let query = new URLSearchParams(tab.url.split("watch")[1]);
            let { playlists } = await browser.storage.local.get("playlists");

            if (playlists && playlists.length > 0) {
                playlists.forEach(async (p) => {
                    if (query.get("list") == p.id) {
                        handleYoutube();
                    }
                });
            }
        } else {
            if (port) {
                port.disconnect();
                port = undefined;
            }
            isPlaylist = false;
            isPlaying = false;
            tabId = undefined;
        }
    });
}

async function handleDelete(id) {
    if (id == tabId) {
        await browser.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                let video = document.querySelector('video[class*="video-stream html5-main-video"]');
                // remove listeners
                video.onpause = () => {};
                video.onplaying = () => {};
            },
        });
        if (port) {
            port.disconnect();
            port = undefined;
        }
        isPlaylist = false;
        isPlaying = false;
        tabId = undefined;
    }
    browser.tabs.query({ currentWindow: true, active: false }).then(init, console.error);
    browser.tabs.query({ currentWindow: true, active: true }).then(init, console.error);
}

async function initNativeApp(m) {
    switch (m) {
        case "video_paused":
            if (port) {
                port.disconnect();
                port = undefined;
            }
            break;
        case "video_playing":
            let [channelName, videoTitle, videoId] = await browser.scripting
                .executeScript({
                    target: { tabId: tabId },
                    func: () => {
                        let query = new URLSearchParams(window.location.search);

                        if (document.URL.split("//")[1].split(".")[0] === "music") {
                            return [
                                document.querySelector("span.subtitle").outerText.split("\n")[0],
                                document.querySelector(".content-info-wrapper > yt-formatted-string:nth-child(1)")
                                    .outerText,
                                query.get("v"),
                            ];
                        } else if (document.URL.split("//")[1].split(".")[0] === "www") {
                            return [
                                document.querySelector("#owner").outerText.split("\n")[0],
                                document.querySelector("yt-formatted-string.ytd-watch-metadata:nth-child(1)").outerText,
                                query.get("v"),
                            ];
                        }
                    },
                })
                .then((ret) => ret[0].result);

            let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            // Permissions should be granted at install time.
            try {
                let res = await fetch(thumbnail, { method: "HEAD", mode: "same-origin" });
                if (res.status != 200) {
                    thumbnail = `https://img.youtube.com/vi/${videoId}/0.jpg`;
                }
            } catch {}

            // Not sure why but length cant be 1 char so addictional space is added (idk why this happens)
            if (channelName.length < minLength) {
                channelName = channelName + " ".repeat(minLength - channelName.length);
            }

            if (videoTitle.length < minLength) {
                videoTitle = videoTitle + " ".repeat(minLength - videoTitle.length);
            }

            if (!port) {
                port = browser.runtime.connectNative("dcrp");
                port.postMessage({
                    channel_name: channelName,
                    video_title: videoTitle,
                    thumbnail,
                });
            } else {
                port.postMessage({
                    channel_name: channelName,
                    video_title: videoTitle,
                    thumbnail,
                });
            }
            break;
        default:
            break;
    }
}

async function init(tabs) {
    tabs.forEach(async (e) => {
        if (e.url.match(ytRegex)) {
            isPlaylist = true;
            tabId = e.id;
            let query = new URLSearchParams(e.url.split("watch")[1]);
            let { playlists } = await browser.storage.local.get("playlists");

            if (playlists && playlists.length > 0) {
                playlists.forEach(async (p) => {
                    if (query.get("list") === p.id) {
                        handleYoutube();
                    }
                });
            }
        }
    });
}

function handlePermissions() {
    browser.tabs.onCreated.addListener(handleCreate);
    browser.tabs.onUpdated.addListener(handleUpdate);
    browser.tabs.onRemoved.addListener(handleDelete);

    browser.tabs.query({ currentWindow: true, active: false }).then(init, console.error);
    browser.tabs.query({ currentWindow: true, active: true }).then(init, console.error);

    browser.runtime.onMessage.addListener(initNativeApp);
}

browser.permissions.onAdded.addListener(handlePermissions);

browser.permissions.onRemoved.addListener(() => {
    browser.tabs.onCreated.removeListener(handleCreate);
    browser.tabs.onUpdated.removeListener(handleUpdate);
    browser.tabs.onRemoved.removeListener(handleDelete);

    browser.runtime.onMessage.removeListener(initNativeApp);
});

browser.permissions.getAll().then((p) => {
    if (p.origins[0] == "*://*.youtube.com/*") {
        handlePermissions();
    }
});

browser.runtime.onMessage.addListener((m) => {
    switch (m) {
        case "add_playlist":
            browser.tabs.query({ currentWindow: true, active: true }).then(init, console.error);
            break;
        case "remove_playlist":
            browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
                if (tabs[0].id == tabId) {
                    handleDelete(tabId);
                }
            });
            break;
        default:
            break;
    }
});
