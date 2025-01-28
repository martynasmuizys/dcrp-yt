#include <string>
#include <iostream>
#include <vector>
#include <fstream>

#include "discord.h"
#include "core.h"

struct DiscordState {
    discord::User currentUser;

    std::unique_ptr<discord::Core> core;
};

int main() {
    unsigned int recv_msg_len = 0;
    std::cin.read((char*)&recv_msg_len, 4);
    std::vector<char> buf(recv_msg_len);

    char* data = new char[recv_msg_len];
    std::cin.read(data, recv_msg_len);

    DiscordState state{};

    // discord::Core* core{};
    // auto result = discord::Core::Create(1333609267143643278, DiscordCreateFlags_Default, &core);
    // state.core.reset(core);
    // if (!state.core) {
    //     std::cout << "Failed to instantiate discord core! (err " << static_cast<int>(result)
    //               << ")\n";
    //     std::exit(-1);
    // }

    // unsigned int msg_len = strlen(state.currentUser.GetUsername());
    // std::cout.write((char*)&recv_msg_len , 4);
    // std::cout << state.currentUser.GetUsername() << std::flush;

    delete[] data;

    return 0;
}

