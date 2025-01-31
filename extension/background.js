var isYoutube = false;
var isPlaying;
var isPlaylist = false;
var tabId;
var ytRegex = /https:\/\/(?:[^\/]+\.)?youtube\.com\/watch.*?(?:\&|\?)list=[^&\s]+/;
var port;
let minLength = 2; // for now

function onError(err) {
    console.log(err);
}

async function handleYoutube() {
    try {
        isPlaying = await browser.scripting
            .executeScript({
                target: { tabId: tabId },
                func: () => {
                    if (!document.querySelector('video[class*="video-stream html5-main-video"]').paused) {
                        setTimeout(() => {
                            browser.runtime.sendMessage("video_playing");
                        }, 3000);
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
                video.addEventListener("pause", () => {
                    setTimeout(() => {
                        browser.runtime.sendMessage("video_paused");
                    }, 3000);
                });
                video.addEventListener("play", () => {
                    setTimeout(() => {
                        browser.runtime.sendMessage("video_playing");
                    }, 3000);
                });
            },
        });

        browser.runtime.onMessage.addListener(async (m) => {
            function onResponse(response) {
                console.log(response);
            }
            switch (m) {
                case "video_paused":
                    if (port) {
                        port.disconnect();
                        port = undefined;
                    }
                    break;
                case "video_playing":
                    let [channelName, videoTitle] = await browser.scripting
                        .executeScript({
                            target: { tabId: tabId },
                            func: () => {
                                return [
                                    document.querySelector("#owner").innerText.split("\n")[0],

                                    document.querySelector("yt-formatted-string.ytd-watch-metadata:nth-child(1)")
                                        .outerText,
                                ];
                            },
                        })
                        .then((ret) => ret[0].result);

                    // Not sure why but length cant be 1 char so addictional space is added (idk why this happens)
                    if (channelName.length < minLength) {
                        channelName = channelName + " ".repeat(minLength - channelName.length);
                    }

                    if (videoTitle.length < minLength) {
                        videoTitle = videoTitle + " ".repeat(minLength - videoTitle.length);
                    }

                    if (!port) {
                        port = browser.runtime.connectNative("dcrp");
                        port.onMessage.addListener(onResponse);
                        port.postMessage({
                            channel_name: channelName,
                            video_title: videoTitle,
                        });
                    } else {
                        port.postMessage({
                            channel_name: channelName,
                            video_title: videoTitle,
                        });
                    }
                    break;
                default:
                    break;
            }
        });
    } catch (e) {
        console.log(e);
    }
}

function handleCreate(tab) {
    if (isYoutube && isPlaylist) return;

    browser.tabs.get(tab.id).then(async (tab) => {
        if (tab.url.match(ytRegex)) {
            isYoutube = true;
            isPlaylist = true;
            tabId = tab.id;
            await handleYoutube();
        }
    });
}

function handleUpdate(id) {
    browser.tabs.get(id).then(async (tab) => {
        if (tab.url.match(ytRegex)) {
            isYoutube = true;
            isPlaylist = true;
            tabId = tab.id;
            await handleYoutube();
        }
    });
}

function handleDelete(id) {
    if (id == tabId) {
        isYoutube = false;
        isPlaylist = false;
        tabId = undefined;
    }
}

function init(tabs) {
    tabs.forEach(async (e) => {
        if (e.url.match(ytRegex)) {
            isYoutube = true;
            isPlaylist = true;
            tabId = e.id;
            await handleYoutube();
        }
    });
}

browser.tabs.onCreated.addListener(handleCreate);
browser.tabs.onUpdated.addListener(handleUpdate);
browser.tabs.onRemoved.addListener(handleDelete);

browser.tabs.query({ currentWindow: true, active: false }).then(init, onError);
browser.tabs.query({ currentWindow: true, active: true }).then(init, onError);
