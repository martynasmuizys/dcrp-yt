cmake_minimum_required(VERSION 3.15...3.31)

project(dcrp)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)
set(CMAKE_EXPORT_COMPILE_COMMANDS TRUE)

file(GLOB_RECURSE SOURCES src/*.cpp)

include_directories(discord)

add_library(discord SHARED IMPORTED)

set_property(TARGET discord PROPERTY IMPORTED_LOCATION "C:/Users/sirzi/Desktop/dcrp-yt/discord/lib/x86_64/discord_game_sdk.dll")
set_property(TARGET discord PROPERTY IMPORTED_IMPLIB "C:/Users/sirzi/Desktop/dcrp-yt/discord/lib/x86_64/discord_game_sdk.dll.lib")

add_executable(${PROJECT_NAME} ${SOURCES})
target_link_libraries(${PROJECT_NAME} ${discord})