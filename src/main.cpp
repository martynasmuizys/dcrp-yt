#include <string>
#include <iostream>

int main() {
    for (std::string line; std::getline(std::cin, line);) {
        if (line == "ping") {
            std::cout << "pong" << '\n';
        }
    }
    return 0;
}

