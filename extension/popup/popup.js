document.addEventListener("DOMContentLoaded", async () => {
    let text = document.getElementById("text");
    let status = document.getElementById("status");
    let btn = document.getElementById("btn");
    let ytRegex = /https:\/\/(?:[^\/]+\.)?youtube\.com\/(?:playlist|watch).*?(?:\&|\?)list=[^&\s]+/;
    let [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    let playlistAdded = (id) => {
        btn.textContent = "Remove";
        text.textContent = "Playlist is tracked";
        status.textContent = "✔";
        status.style.color = "green";
        btn.onclick = () => removePlaylist(id);
        browser.runtime.sendMessage("add_playlist");
    };

    let removePlaylist = async (id) => {
        let { playlists } = await browser.storage.local.get("playlists");
        let idx = playlists.indexOf({ id });
        playlists.splice(idx, 1);

        await browser.storage.local.set({ playlists });

        btn.textContent = "Add";
        text.textContent = "Playlist is not tracked";
        status.textContent = "✖";
        status.style.color = "red";
        let after = await browser.storage.local.get("playlists").playlists;

        browser.runtime.sendMessage("remove_playlist");
        btn.onclick = () => addPlaylist(id);
    };

    let addPlaylist = async (id) => {
        let { playlists } = await browser.storage.local.get("playlists");

        if (playlists && playlists.length > 0) {
            playlists.push({ id });
            await browser.storage.local.set({ playlists });
            playlistAdded(id);
        } else {
            await browser.storage.local.set({
                playlists: [{ id }],
            });
            playlistAdded(id);
        }
    };

    if (tab.url.match(ytRegex)) {
        browser.storage.local.get("playlists").then((ret) => {
            let { playlists } = ret;
            if (playlists && playlists.length > 0) {
                playlists.forEach((e) => {
                    let tquery = new URLSearchParams("?" + tab.url.split("?")[1]);

                    if (e.id === tquery.get("list")) {
                        btn.textContent = "Remove";
                        text.textContent = "Playlist is tracked";
                        status.textContent = "✔";
                        status.style.color = "green";

                        btn.onclick = () => removePlaylist(e.id);
                    } else {
                        btn.onclick = () => addPlaylist(tquery.get("list"));
                    }
                });
            } else {
                let tquery = new URLSearchParams("?" + tab.url.split("?")[1]);
                btn.onclick = () => addPlaylist(tquery.get("list"));
            }
        });
    } else {
        text.textContent = "Not a playlist";
        btn.style.display = "none";
    }
});
