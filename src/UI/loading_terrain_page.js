
import spa from "/src/UI/spa.js";
import World from "/src/World/World.js";

spa.addEventListener("loading_terrain_page", "load", (pageID, data) => {
    var world = new World();
    spa.openPage("play_game_page", world);
});
