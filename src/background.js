var modFS
//make the code platform agnostic
// I should be okay without this now that I'm using the polyfill, but keeping it just in case
if (typeof browser === "undefined") browser = chrome

browser.downloads.onCreated.addListener(downloadListener)

//handles all messages from the content scripts and the install pages
browser.runtime.onConnect.addListener((port)=>{
    port.onMessage.addListener((m)=>{
        console.log(m)
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
    let modPaths = await modFS.list()
    for (let path of modPaths) {
        let blob = await modFS.get(path)
        port.postMessage({
            type:"mod",
            blob: blob
        })
    }
}

//downloads a .xhordes.zip and saves it to the db
async function install(port, url) {
    let fs = new zip.fs.FS()
    await fs.root.importHttpContent(url)

    //load manifest so we can add it to the mod list
    let file = await fs.find("manifest.json")
    manifest = JSON.parse(await file.getText())

    //update modlist to contain the new mod's information
    let modList = await browser.storage.local.get("modList")
    modList[manifest.name] = {
        author:manifest.author,
        home:manifest.home,
        description:manifest.description
    }
    browser.storage.local.set({
        modList:modList
    })

    let blob = await fs.root.exportBlob()

    //write the blob into a zip file
    await modFS.put(`${manifest.name}.zip`, blob)
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
}

(async()=>{
    modFS = await IDBFiles.getFileStorage({name:"mods"})
})()