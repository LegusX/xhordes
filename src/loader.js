/*
The content script that gets injected into web pages to load all of our mods.

Communicates with the main extension to get all the mods so it can embed them
*/
(async()=>{
    console.log("hello world?")
    ////////////////////////////////////////////////////////////////
    // Will eventually come back to this code to implement a caching system, but until then we'll just pull everything via the messaging system
    //
    // get the list of installed mods
    let data = await browser.storage.local.get("modList")
    let modList = data.modList

    // //get the metadata for install mods
    // let meta = await browser.storage.local.get(modList)
    
    // for (let name of modList) {
    //     let DB = await IDBFiles.getFileStorage({name})
    //     let fileList = await DB.list()
    //     if (meta[name].js && fileList.contains(meta[name].js)) {
    //         let js = await DB.get(meta[name].js)
    //         js = await js.text()
    //         loadJS(js)
    //     }
    //     if (meta[name].css && fileList.contains(meta[name].css)) {
    //         let css = await DB.get(meta[name].css)
    //         css = await css.text()
    //         loadCSS(css)
    //     }
    //     else if (fileList.contains(meta[name].css)) {
    //         port.postMessage({
    //             type:"getMod",
    //             name:name,
    //             file:meta[name].css
    //         })
    //     }
    // }

    let port = browser.runtime.connect()
    port.onMessage.addListener((m)=>{
        switch (m.type) {
            case "mods": 
                for (let mod of m.mods) {
                    console.log(mod)
                    if (mod.js) loadJS(mod.js, mod.module)
                    if (mod.css) loadCSS(mod.css)
                }
        }
    })
    port.postMessage({
        type:"getMods"
    })

    function loadJS(file, module) {
        let script = document.createElement("script")
        script.innerHTML = file
        document.head.appendChild(script)
    }
    function loadCSS(file) {
        let script = document.createElement("style")
        script.innerHTML = file
        document.head.appendChild(script)
    }
})()