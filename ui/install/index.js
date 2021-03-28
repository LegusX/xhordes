let manifest = {}
let icon

window.onload = async ()=>{
    await getMod()
    render()
}

async function getMod() {
    return new Promise((resolve, reject)=>{
        console.log("hi?")
        let url = location.href.split("?")[1]
        let port = browser.runtime.connect()
        console.log("connected")
        port.onMessage.addListener((m)=>{
            console.log(m)
            if (m.type == "manifest") {
                console.log("receieve manifest")
                manifest = m.manifest
                icon = m.icon
                resolve()
            }
        })
        port.postMessage({
            type:"getManifest",
            url:url
        })
        console.log("message posted")
    })
}

function install(){
    let port = browser.runtime.connect()
    port.onMessage = (m)=>{
        if (m.type === "installed") {
            alert(manifest.name+" has been successfully installed!\nIf you currently have hordes.io open, reload the page to use the new mod.")
        }
    }
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

    //hide loading and show loaded
    document.getElementById("loading").style.display = "none"
    document.getElementById("loaded").style.display = ""
}