document.addEventListener("DOMContentLoaded", async () => {
    let text = document.getElementById("text");
    let status = document.getElementById("status");
    let btn = document.getElementById("btn");
    let ytRegex = /https:\/\/(?:[^\/]+\.)?youtube\.com\/(?:playlist|watch).*?(?:\&|\?)list=[^&\s]+/;
    let [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (tab.url.match(ytRegex)) {
        browser.storage.local.get("playlists").then((ret) => {
            let {playlists} = ret;
            if (playlists && playlists.length > 0) {
                playlists.forEach((e) => {
                    let tquery = new URLSearchParams("?" + tab.url.split("?")[1]);

                    if (e.id === tquery.get("list")) {
                        btn.textContent = "Remove";
                        text.textContent = "Playlist is tracked";
                        status.textContent = "✔";
                        status.style.color = "green";

                        btn.onclick = () => {
                            browser.storage.local.get("playlists").then((ret) => {
                                let playlists = ret.playlists;
                                let idx = playlists.indexOf({ id: e.id });
                                playlists.splice(idx, 1);
                                browser.storage.local.set({ playlists }).then(() => {
                                    btn.textContent = "Add";
                                    text.textContent = "Playlist is not tracked";
                                    status.textContent = "✖";
                                    status.style.color = "red";
                                    browser.runtime.sendMessage("remove_playlist");
                                });
                            });
                        };
                    } else {
                        btn.onclick = () => {
                            browser.storage.local.get("playlists").then((ret) => {
                                let playlists = ret.playlists;
                                playlists.push({ id: tquery.get("list") });
                                browser.storage.local.set({ playlists }).then(() => {
                                    btn.textContent = "Remove";
                                    text.textContent = "Playlist is tracked";
                                    status.textContent = "✔";
                                    status.style.color = "green";
                                    browser.runtime.sendMessage("add_playlist");
                                });
                            });
                        };
                    }
                });
            } else {
                let tquery = new URLSearchParams("?" + tab.url.split("?")[1]);
                btn.onclick = () => {
                    browser.storage.local
                        .set({
                            playlists: [{ id: tquery.get("list") }],
                        })
                        .then(() => {
                            btn.textContent = "Remove";
                            text.textContent = "Playlist is tracked";
                            status.textContent = "✔";
                            status.style.color = "green";
                            browser.runtime.sendMessage("add_playlist");
                        });
                };
            }
        });
    } else {
        text.textContent = "Not a playlist";
        btn.style.display = "none";
    }
});
