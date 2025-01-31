#include <iostream>
#include <thread>
#include <mutex>
#include <nlohmann/json.hpp>

#include "discord/discord.h"

using json = nlohmann::json;

struct DiscordState {
    discord::User currentUser;

    std::unique_ptr<discord::Core> core;
};

namespace {
    volatile bool listening{true};

    std::string channel = "";

    std::string title = "";

    std::mutex mtx;
}

int main()
{
    DiscordState state{};

    discord::Core* core{};
    auto result = discord::Core::Create(1333609267143643278, DiscordCreateFlags_NoRequireDiscord, &core);
    state.core.reset(core);
    if (!state.core) {
        std::cout << "Failed to instantiate discord core! (err " << static_cast<int>(result)
                  << ")\n";
        std::exit(-1);
    }

    std::thread dc([&state](){
        mtx.lock();
        std::string last_channel = channel;
        std::string last_title = title;
        mtx.unlock();
        do {
            state.core->RunCallbacks();

            if((channel != last_channel) || (title != last_title)) {
                mtx.lock();
                last_channel = channel;
                last_title = title;
                mtx.unlock();

                discord::Activity activity{};
                activity.SetState(channel.c_str());
                activity.SetDetails(title.c_str());
                activity.GetAssets().SetLargeImage("bladerunner");
                activity.GetAssets().SetLargeText("CUSTOM thing available on my github (dcrp-yt)");
                state.core->ActivityManager().UpdateActivity(activity, [](discord::Result result){});
            }
        std::this_thread::sleep_for(std::chrono::milliseconds(16));
        } while (listening);
    });

    std::thread messages([](){
        while(true) {
            unsigned int recv_msg_len = 0;
            std::cin.read((char*)&recv_msg_len, 4);
            std::vector<char> buf(recv_msg_len);
            std::cin.read(buf.data(), recv_msg_len);
            std::string data(buf.begin(), buf.end());

            std::this_thread::sleep_for(std::chrono::milliseconds(3));

            if (data.empty()) {
                continue;
            }

            json parsed = json::parse(data);

            mtx.lock();
            channel = parsed["channel_name"];
            title = parsed["video_title"];
            mtx.unlock();
        }
    });

    messages.join();
    dc.join();

    return 0;
}
