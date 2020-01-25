
import spa from "./spa.js";
import {RESOURCES, waitResource} from "../loadResources.js";

let world_config = {};

waitResource("src/World/world_config.json")
.then(cfg => {
    world_config = cfg;
});

window.RESOURCES = RESOURCES;

spa.addEventListener("options_page", "load", pageID => {
    ("x, y, z").split(", ").forEach((k, i) => {
        document.getElementsByTagName("input")[i].value = world_config.size[k];
    });
});
spa.addEventListener("options_page", "unload", pageID => {
    ("x, y, z").split(", ").forEach((k, i) => {
        let v = 1 * document.getElementsByTagName("input")[i].value;
        if (v >= 2) world_config.size[k] = v;
    });
});
spa.addEventListener("options_page", "overlap", pageID => {

});
spa.addEventListener("options_page", "unoverlap", pageID => {

});
