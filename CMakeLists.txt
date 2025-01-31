cmake_minimum_required(VERSION 3.15...3.31)

project(dcrp)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)
set(CMAKE_EXPORT_COMPILE_COMMANDS TRUE)

file(GLOB_RECURSE DISCORD src/discord/*.cpp)

set(JSON_BuildTests OFF CACHE INTERNAL "")
add_subdirectory(nlohmann-json)

add_library(discord-sdk SHARED IMPORTED)

set_property(TARGET discord-sdk PROPERTY IMPORTED_LOCATION "${PROJECT_SOURCE_DIR}/src/discord/lib/x86_64/discord_game_sdk.dll")
set_property(TARGET discord-sdk PROPERTY IMPORTED_IMPLIB "${PROJECT_SOURCE_DIR}/src/discord/lib/x86_64/discord_game_sdk.dll.lib")

add_executable(${PROJECT_NAME} src/main.cpp ${DISCORD})

target_link_libraries(${PROJECT_NAME} discord-sdk nlohmann_json::nlohmann_json)

add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
    "${PROJECT_SOURCE_DIR}/src/discord/lib/x86_64/discord_game_sdk.dll"
    $<TARGET_FILE_DIR:${PROJECT_NAME}>
)
