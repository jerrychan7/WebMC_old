
var allPage = {}, nowPageRoute = [];

const getFileNameNoExt = url => url.match(/([^<>/\\\|:""\*\?]+)\.(\w+$)/)[1];

const spa = {
    enrollPage(id, content, type = "float") {
        if (id in allPage)
            throw "id为 " + id + " 的页面已经注册过";
        var div = document.createElement("div");
        div.id = id;
        div.innerHTML = content;
        allPage[id] = {
            page: div, type,
            callback:{load:[],unload:[],unoverlap:[],overlap:[]}
        };
        return this;
    },

    addEventListener(id, eventType, callback = (nextPageId) => {}) {
        const p = allPage[id];
        if (!p) throw "id为 " + id + "的页面不存在";
        if (p[eventType]) p.callback[eventType].push(callback);
        else p.callback[eventType] = [callback];
    },

    openPage(nextID = "", data = {}) {
        const nextPage = allPage[nextID];
        if (!nextPage) throw "id为 " + nextID + "的页面不存在";
        const routeLen = nowPageRoute.length,
              nowID = nowPageRoute[routeLen - 1];
        if (nowID === nextID) return this;
        const lastID = (routeLen > 1 ?
                        nowPageRoute[routeLen - 2]:
                        "");
        //float->last jump/float   pop
        if (nextID === lastID) {
            allPage[nowID].callback.unload.forEach(f => f(nextID, data));
            document.body.removeChild(document.body.lastChild);
            nowPageRoute.pop();
            nextPage.callback.unoverlap.forEach(f => f(nowID, data));
        }
        //jump/float -> new float   push
        else if (nextPage.type === "float") {
            if (nowID) allPage[nowID].callback.overlap.forEach(f => f(nextID, data));
            document.body.appendChild(nextPage.page);
            nowPageRoute.push(nextID);
            nextPage.callback.load.forEach(f => f(nowID, data));
        }
        //jump/float -> new jump   new empty
        else if (nextPage.type === "jump") {
            nowPageRoute.reverse();
            nowPageRoute.forEach(ID => {
                if (ID in allPage)
                    allPage[ID].callback.unload.forEach(f => f(nextID, data));
            });
            document.body.innerHTML = "";
            document.body.appendChild(nextPage.page);
            nowPageRoute = [nextID];
            nextPage.callback.load.forEach(f => f(nowID, data));
        }
    },

    enrollPageByURL(url, type, id = "") {
        return import("/src/loadResources.js")
               .then(({asyncLoadResByUrl}) => asyncLoadResByUrl(url))
               .then(content => {
                   spa.enrollPage(id || getFileNameNoExt(url), content, type);
               });
    },

    enrollPageByDefault() {
//        import("./spaDefaultLoad.js").then(({default: config}) => {
        import("/src/loadResources.js")
        .then(({asyncLoadResByUrl}) => asyncLoadResByUrl("src/UI/spaDefaultLoad.json"))
        .then(config => {
            for (var id in config) {
                this.enrollPageByURL(config[id].filePath, config[id].pageType, id).then(_ => {
                    if (config[id].include) import(config[id].include);
                });
            }
        });
    }
};

//export default spa;
export {
    spa as default,
    spa
}

window.addEventListener("hashchange", _ => {
    const id = window.location.hash.replace("#", "");
    spa.openPage(id);
});
