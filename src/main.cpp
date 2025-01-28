#include <string>
#include <iostream>
#include <vector>
#include <fstream>

int main() {
    unsigned int recv_msg_len = 0;

    std::cin.read((char*)&recv_msg_len, 4);
    std::vector<char> buf(recv_msg_len);
    char* data = new char[recv_msg_len];
    std::cin.read(data, recv_msg_len);
    
    // std::string message(buf.begin(), buf.end());

    // std::string msg = "pong";
    // msg = message;

    // unsigned int msg_len = strlen(msg.c_str());
    std::cout.write((char*)&recv_msg_len , 4);
    std::cout << data << std::flush;

    delete[] data;

    return 0;
}

