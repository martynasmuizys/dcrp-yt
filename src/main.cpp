#include <iostream>
#include <thread>
#include <mutex>
#include <nlohmann/json.hpp>
#include <fstream>

#include "discord/discord.h"

using json = nlohmann::json;

struct DiscordState
{
    discord::User currentUser;

    std::unique_ptr<discord::Core> core;
};

namespace
{
    volatile bool listening{true};

    volatile bool update_needed{false};

    std::string channel = "";

    std::string title = "";

    std::string thumbnail = "";

    std::mutex mtx;
}

int main()
{
    DiscordState state{};
    discord::Core *core{};
    auto result = discord::Core::Create(1333609267143643278, DiscordCreateFlags_NoRequireDiscord, &core);

    state.core.reset(core);
    if (!state.core)
    {
        std::cout << "Failed to instantiate discord core! (err " << static_cast<int>(result)
                  << ")\n";
        std::exit(-1);
    }

    std::thread dc([&state]()
                   {
        do {
            state.core->RunCallbacks();

            if(update_needed) {
                mtx.lock();
                discord::Activity activity{};
                activity.SetState(channel.c_str());
                activity.SetDetails(title.c_str());
                activity.GetAssets().SetLargeImage(thumbnail.c_str());
                mtx.unlock();
                update_needed = false;

                state.core->ActivityManager().UpdateActivity(activity, [](discord::Result result){});
            }
        std::this_thread::sleep_for(std::chrono::milliseconds(16));
        } while (listening); });

    std::thread messages([]()
                         {
        while(listening) {
            unsigned int recv_msg_len = 0;
            std::cin.read((char*)&recv_msg_len, 4);
            std::vector<char> buf(recv_msg_len);
            std::cin.read(buf.data(), recv_msg_len);
            std::string data(buf.begin(), buf.end());

            std::this_thread::sleep_for(std::chrono::seconds(2));

            if (data.empty()) {
                continue;
            }

            json parsed = json::parse(data);

            mtx.lock();
            channel = parsed["channel_name"];
            title = parsed["video_title"];
            thumbnail = parsed["thumbnail"];
            mtx.unlock();
            update_needed = true;
        } });

    messages.join();
    dc.join();

    return 0;
}
