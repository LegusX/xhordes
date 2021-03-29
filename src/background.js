var modFS
var currentZip
//make the code platform agnostic
// I should be okay without this now that I'm using the polyfill, but keeping it just in case
if (typeof browser === "undefined") browser = chrome

browser.downloads.onCreated.addListener(downloadListener)

//handles all messages from the content scripts and the install pages
browser.runtime.onConnect.addListener((port)=>{
    port.onMessage.addListener((m)=>{
        switch (m.type) {
            case "getMods":
                getMods(port)
                break;
            case "install":
                install(port, m.url)
                break;
            case "getManifest":
                getManifest(port, m.url)
                break;
        }
    })
})

function downloadListener(dl) {
    if (dl.url.includes(".xhordes.zip")) {
        console.log("Detected .xhordes.zip file")
        browser.downloads.cancel(dl.id)
        openInstallPage(dl.url)
    }
}

//opens the page used to verify whether or not the user wishes to install this extension
function openInstallPage(url) {
    browser.tabs.create({
        url:"/install/index.html?"+url
    })
}

//retrieves all the mods from the db and sends them to loader.js so that they can be loaded into the game
async function getMods(port) {
    let data = await browser.storage.local.get("modList")
    console.log(await modFS.list())
    let modList = data.modList
    if (typeof modList === "undefined") return; //no mods are installed
    let mods = []
    for (let name of modList) {
        let mod = {}
        let data = await browser.storage.local.get(name)
        let manifest = data[name]
        if (manifest.js) {
            let blob = await modFS.get(name+"-"+manifest.js)
            mod.js = await blob.text()
        }
        if (manifest.css) {
            let blob = await modFS.get(name+"-"+manifest.css)
            mod.css = await blob.text()
        }
        if (mod !== {}) mods.push(mod)
    }
    console.log("sending mods")
    port.postMessage({
        type:"mods",
        mods
    })
}

async function install(port) {
    if (typeof currentZip === "undefined") throw new Error("No .xhordes.zip was cached!")

    let manifest = JSON.parse(await currentZip.file("manifest.json").async("string"))

    //update modlist to contain the new mod's information
    let data = await browser.storage.local.get("modList")
    let modList = data.modList
    if (typeof modList === "undefined") modList = [manifest.name]
    else if (modList.indexOf(manifest.name) === -1) modList.push(manifest.name)
    await browser.storage.local.set({modList})

    //save metadata to storage as well
    let meta = {
        author:manifest.author,
        home:manifest.home,
        description:manifest.description,
        icon:`data:image/${manifest.icon.split(".")[1]};base64,`+await currentZip.file(manifest.icon).async("base64"),
        js:manifest.js,
        css:manifest.css,
        version:manifest.version,
        enabled:true
    }
    await browser.storage.local.set({[manifest.name]:meta})

    //save entire zip file to indexeddb for later retrieval
    // await modFS.put(`${manifest.name}.zip`, await currentZip.generateAsync({
    //     type:"blob"
    // }))
    await modFS.put(manifest.name+"-manifest.json", await currentZip.file("manifest.json").async("blob"))
    if (manifest.js) await modFS.put(manifest.name+"-"+manifest.js, await currentZip.file(manifest.js).async("blob"))
    if (manifest.css) await modFS.put(manifest.name+"-"+manifest.css, await currentZip.file(manifest.css).async("blob"))

    port.postMessage({
        type:"installed"
    })
}

async function getManifest(port,url) {
    let zip = new JSZip()
    let response = {
        type:"manifest"
    }

    let data = await fetch(url)
    data = await data.blob()
    await zip.loadAsync(data)
    
    response.manifest = JSON.parse(await zip.file("manifest.json").async("string"))
    if (response.manifest.icon) response.icon = `data:image/${response.manifest.icon.split(".")[1]};base64,`+await zip.file(response.manifest.icon).async("base64")
    port.postMessage(response)

    currentZip = zip //no need to redownload the file if we can just cache it instead
}

(async()=>{
    modFS = await IDBFiles.getFileStorage({name:"mods"})
})()