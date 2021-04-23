var modFS
var currentZip
//make the code platform agnostic
// I should be okay without this now that I'm using the polyfill, but keeping it just in case
if (typeof browser === "undefined") browser = chrome

browser.downloads.onCreated.addListener(downloadListener)
browser.webRequest.onBeforeRequest.addListener(requestListener, {urls:["https://hordes.io/client.js*"]}, ["blocking"])

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
            case "uninstall":
                uninstall(port,m.mod)
                break;
            case "dev":
                dev(m.port)
                break;
        }
    })
})

function requestListener (details) {
    console.log("request?")
    return {redirectUrl:"https://cdn.jsdelivr.net/gh/LegusX/xhordes-expose/build/client.js"}
}

function downloadListener(dl) {
    if (typeof dl.byExtensionId !== "undefined") return //download initiated by us
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
        short:manifest.short,
        enabled:true
    }
    await browser.storage.local.set({[manifest.name]:meta})

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
    currentZip = zip //no need to redownload the file if we can just cache it instead
    
    response.manifest = JSON.parse(await zip.file("manifest.json").async("string"))

    if (!(await verify(response.manifest, port))) return; //if it fails verification don't bother sending over the manifest

    if (response.manifest.icon) response.icon = `data:image/${response.manifest.icon.split(".")[1]};base64,`+await zip.file(response.manifest.icon).async("base64")
    port.postMessage(response)
}

async function uninstall(port, name) {
    //remove metadata
    let meta = (await browser.storage.local.get(name))[name]
    await browser.storage.local.remove(name)

    //remove all the saved files
    await modFS.remove(name+"-"+"manifest.json")
    if (meta.js) await modFS.remove(name+"-"+meta.js)
    if (meta.css) await modFS.remove(name+"-"+meta.css)

    port.postMessage({
        type:"uninstalled",
        mod:name
    })
}

(async()=>{
    modFS = await IDBFiles.getFileStorage({name:"mods"})
})()

//makes sure the manifest follows all the rules as defined in the wiki
async function verify(meta, port) {
    let error = {
        type:"error",
        error:""
    }

    //make sure required fields are good
    if (typeof meta.name === "undefined") error.error="Mod name is undefined!"
    if (typeof meta.name !== "undefined" && meta.name.length > 20) error.error="Mod name cannot exceed 20 characters!"
    if (typeof meta.name !== "undefined" && meta.name.length == 0) error.error="Mod name cannot be empty!"
    if (typeof meta.author === "undefined") error.error+="\nAuthor field is undefined!"
    if (typeof meta.author !== "undefined" && meta.author.length > 20) error.error+="\nAuthor field cannot exceed 20 characters!"
    if (typeof meta.author !== "undefined" && meta.author.length == 0) error.error+="\nAuthor field cannot be empty!"
    if (typeof meta.description === "undefined") error.error+="\nDescription is undefined!"
    if (typeof meta.description !== "undefined" && meta.description.length > 500) error.error+="\nDescription cannot exceed 500 characters!"
    if (typeof meta.description !== "undefined" && meta.description.length == 0) error.error+="\nDescription cannot be empty!"

    //make sure the specified files exist
    if (typeof meta.js !== "undefined") {
        let file = await currentZip.file(meta.js)
        if (file === null) error.error+=`\nFile '${meta.js}' not found!`
    }
    if (typeof meta.css !== "undefined") {
        let file = await currentZip.file(meta.css)
        if (file === null) error.error+=`\nFile '${meta.css}' not found!`
    }
    if (typeof meta.icon !== "undefined") {
        let file = await currentZip.file(meta.icon)
        if (file === null) error.error+=`\nFile '${meta.icon}' not found!`
    }
    
    if (error.error !== "") {
        port.postMessage(error)
        return false
    }
    else return true
}

function dev(port) {
    ws = new WebSocket("localhost:"+port)
    ws.onopen = ()=>{
        ws.send(JSON.stringify({
            type:"ready"
        }))
    }
}