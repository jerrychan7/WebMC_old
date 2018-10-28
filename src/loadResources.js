
/* this module let the program have ability to load resources in advance and asynchronously.
 * this module also provide a simple resources storage.
 * export:
 *     function asyncLoadResByUrl(string url) => Promise (defaule)
 *       -> Loading resources asynchronously according to URL
 *     function setResource(string key, anyObj val) => void
 *       -> Add resource and enable the programs that are blocked by relying on this resource can continue to run.
 *     function waitResource(string key) => Promise
 *       -> Waiting for a specific resource to load.
 *     object preloaded:
 *         bool loadFinish    -> flag the preload is completed
 *         function onloadend(function callback)
 *           -> Add a callback function that will be called when the preload is complete.
 *         function onrefresh(function callback(object count))
 *           -> Add a callback function that will be called when the preload resource state changes.
 *     object RESOURCES    -> All resources, the default key value is URL.
 */

const RESOURCES = {},
      preloaded = {
          loadFinish: false,
          [Symbol.for("callbacks")]: {
              loadend: [], refresh: []
          },
          [Symbol.for("loadend")]() {
              this.loadFinish = true;
              this[Symbol.for("callbacks")].loadend.forEach(f=>f());
          },
          [Symbol.for("refresh")](count) {
              this[Symbol.for("callbacks")].refresh.forEach(f => f(count));
          },
          refreshPromises: new Proxy({}, {
              get (count, url) {
                  return url in count ? count[url] : 0;
              },
              set (count, url, prom) {
                  count[url] = url in count ? count[url]+1 : 1;
                  preloaded[Symbol.for("refresh")](count);
                  prom.then(_ => {
                      --count[url];
                      preloaded[Symbol.for("refresh")](count);
                      return new Promise(s => setTimeout(s, 1000));
                  }).then(_ => {
                      if (preloaded.loadFinish) return;
                      for (var url in count)
                          if (count[url]) return;
                      preloaded[Symbol.for("loadend")]();
                  });
                  return true;
              }
          }),
          onloadend(callback) {
              this[Symbol.for("callbacks")].loadend.push(callback);
          },
          onrefresh(callback) {
              this[Symbol.for("callbacks")].refresh.push(callback);
          }
      },
      awaitRes = new Proxy(RESOURCES, {
          callback: {},
          get(res, key, rec) {
              var p = new Promise((s, f) => {
                  if (key in res) s(res[key]);
                  else if (key in this.callback) this.callback[key].push({s, f});
                  else this.callback[key] = [{s, f}];
              });
              if (preloaded.loadFinish === false)
                  preloaded.refreshPromises[key] = p;
              return p;
          },
          set(res, key, val, rec) {
              res[key] = val;
              if (key in this.callback) {
                  this.callback[key].forEach(o => o.s(val));
                  this.callback[key] = [];
              }
              return true;
          }
      });

function asyncLoadResByUrl(url) {
    if (url in awaitRes) return awaitRes[url];
    const [fileName, fileNameNoExt, fileExtension] = url.match(/([^<>/\\\|:""\*\?]+)\.(\w+$)/),
          type = ({png: "img", json:"json"})[fileExtension] || "text";
    if (type === "img")
        getImg(url).then(img => awaitRes[url] = img);
    else if (type === "json")
        getJSON(url).then(obj => awaitRes[url] = obj);
    else if (type === "text")
        getText(url).then(text => awaitRes[url] = text);
    return awaitRes[url];
}

export {
    asyncLoadResByUrl as default,
    asyncLoadResByUrl,
    preloaded, RESOURCES
};
export function setResource(key, val) {
    awaitRes[key] = val;
}
export function waitResource(key) {
    return awaitRes[key];
}

function getJSON(url) {
    return ajaxByUrlAndType(url, "json");
}

function getText(url) {
    return ajaxByUrlAndType(url, "text");
}

function ajaxByUrlAndType(url, type) {
    return new Promise((s, f) => {
        const ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function() {
            if (this.readyState !== 4) return;
            if (this.status === 200) s(this.response);
            else f(new Error(this.statusText));
        };
        ajax.responseType = type;
        ajax.open("GET", url);
        ajax.send();
    });
}

function getImg(url) {
    return new Promise((s, f) => {
        const img = new Image();
        img.onload = function() {
            s(this);
        };
        img.onerror = f;
        img.src = url;
    });
}
