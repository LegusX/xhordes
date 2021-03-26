const {fs} = window.zip
//make the code platform agnostic
// I should be okay without this now that I'm using the polyfill, but keeping it just in case
if (typeof browser === "undefined") browser = chrome

//add listener for .xhordes.zip downloads
zipFilter = {
    urls: ["*://*/*.xhordes.zip"] //only trigger listener for urls that end in .xhordes.zip
}
browser.webRequest.onBeforeRequest.addListener(zipListener, zipFilter)

//handles all messages from the content scripts and the install pages
browser.runtime.onConnect.addListener((port)=>{
    port.onMessage = (m)=>{
        switch (m.type) {
            case "getMods":
                getMods(port)
                break;
            case "install":
                install(m.url)
                break;
        }
    }
})

function zipListener(details) {
    if (details.originUrl.includes("chrome-extension") || details.originUrl.includes("moz-extension")) return; //don't want to cancel download requests for the zip by us
    openInstallPage(details.url)
    return {cancel:true}
}

//opens the page used to verify whether or not the user wishes to install this extension
function openInstallPage(url) {
    browser.tabs.create({
        url:"/install/index.html?"+url
    })
}

//retrieves all the mods from the db and sends them to loader.js so that they can be loaded into the game
function getMods(port) {

}

//downloads a .xhordes.zip and saves it to the db
function install(url) {
    let fs = zip.fs.FS()
    await fs.root.importHttpContent(url)
}