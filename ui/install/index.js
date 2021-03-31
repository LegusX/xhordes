let manifest = {}
let icon

// Make the code platform agnostic
// I should be okay without this now that I'm using the polyfill, but keeping it just in case
// Okay so apparently the polyfill doesn't work, so I still need this. Going to have look into why that's the case
if (typeof browser === "undefined") browser = chrome

window.onload = async ()=>{
    await getMod()
    render()
}

async function getMod() {
    return new Promise((resolve, reject)=>{
        let url = location.href.split("?")[1]
        let port = browser.runtime.connect()
        port.onMessage.addListener((m)=>{
            if (m.type == "manifest") {
                manifest = m.manifest
                icon = m.icon
                resolve()
            }
            if (m.type == "error") {
                document.getElementById("loading").style.display = "none"
                document.getElementById("error").style.display = ""
                document.getElementById("errortext").innerText = m.error
            }
        })
        port.postMessage({
            type:"getManifest",
            url:url
        })
    })
}

function install(){
    let port = browser.runtime.connect()
    port.onMessage.addListener((m)=>{
        if (m.type === "installed") {
            alert(manifest.name+" has been successfully installed!\nIf you currently have hordes.io open, reload the page to use the new mod.")
            window.close()
        }
    })
    port.postMessage({
        type:"install",
        url: location.href.split("?")[1]
    })
}
function render() {
    document.getElementById("name").innerText = manifest.name;
    document.getElementById("author").innerText = "By "+manifest.author
    document.getElementById("description").innerText = manifest.description
    document.getElementById("homelink").href = manifest.home
    document.getElementById("icon").src = icon

    document.getElementById("install").addEventListener("click",install)
    document.getElementById("cancel").addEventListener("click", ()=>window.close())

    //hide loading and show loaded
    document.getElementById("loading").style.display = "none"
    document.getElementById("loaded").style.display = ""
}