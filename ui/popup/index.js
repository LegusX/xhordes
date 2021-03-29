//make the code platform agnostic
// I should be okay without this now that I'm using the polyfill, but keeping it just in case
if (typeof browser === "undefined") browser = chrome

var currentTab = "home"

window.onload = ()=>{
    document.getElementById("homelink").addEventListener("click", ()=>tab("home"))
    document.getElementById("modslink").addEventListener("click", ()=>tab("mods"))
    document.getElementById("settingslink").addEventListener("click", ()=>tab("settings"))

    status("GOOD", "green")
    updateModList()
}

function tab(page) {
    document.getElementById(currentTab).style.display = "none"
    document.getElementById(currentTab+"link").classList.toggle("active")
    document.getElementById(page).style.display = ""
    document.getElementById(page+"link").classList.toggle("active")
    currentTab = page
}

function status(status, color) {
    document.getElementById("status").innerText = status
    document.getElementById("status").classList = "label "+color
}

//retrieves the mod list from browser.storage and then adds it to the "mods" tab
async function updateModList() {
    let data = await browser.storage.local.get("modList")
    let modList = data.modList
    if (typeof modList === "undefined") modList = []

    let modDiv = document.getElementById("mods")
    
    //clean up everything from the last update of the list
    while(modDiv.firstChild) {
        modDiv.removeChild(modDiv.firstChild)
    }

    let enabled = 0
    //iterate through all the mod metadata and create divs for each of them
    for (name of modList) {
        let data = await browser.storage.local.get(name)
        let mod = data[name]
        if (typeof mod === "undefined") throw new Error("Mod in modlist but can't find metadata")

        let div = document.createElement("div")
        div.classList.add("container-fluid")
        div.style.minHeight = "32px"
        div.style.marginTop = "1em"

        let button = document.createElement("button")
        if (mod.enabled) button.classList.add("btn-success"),button.innerText = "ON"
        else button.classList.add("btn-danger"),button.innerText = "OFF"
        button.classList.add("btn")
        button.classList.add("toggle")
        button.setAttribute("mod", name)
        button.addEventListener("click", toggle)
        div.appendChild(button)

        let homeLink = document.createElement("a")
        homeLink.href = mod.home
        div.appendChild(homeLink)

        let title = document.createElement("h4")
        title.innerText = name
        title.style.display = "inline"
        homeLink.appendChild(title)

        let icon = document.createElement("img")
        icon.src = mod.icon
        icon.classList.add("icon")
        div.appendChild(icon)

        let version = document.createElement("i")
        version.innerText = "v"+mod.version
        version.style.marginLeft = "10px"
        div.appendChild(version)

        let author = document.createElement("p")
        author.innerText = "By "+mod.author
        div.appendChild(author)

        if (mod.short) {
            let short = document.createElement("p")
            short.innerText = mod.short
            div.appendChild(short)
        }

        let hr = document.createElement("hr")
        div.appendChild(hr)

        //finally append this whole thing to the mods div
        modDiv.appendChild(div)

        if (mod.enabled) {
            //figure out how many mods are enabled
            enabled++
        }
    }

    if (modList.length == 0) {
        let nomods = document.createElement("p")
        nomods.innerHTML = "It looks like you don't have any mods installed! Check out the <a href=''>Discord Server</a> for a list of curated mods!"
        modDiv.appendChild(nomods)
    }

    //update the modcount on the front page
    document.getElementById("modcount").innerText = modList.length
    document.getElementById("activemodcount").innerText = enabled
}

async function toggle(e) {
    let name = e.target.getAttribute("mod")
    let data = await browser.storage.local.get(name)
    let mod = data[name]
    if (typeof mod === "undefined") throw new Error("Mod name given has no metadata")
    mod.enabled = !mod.enabled

    if (mod.enabled) {
        e.target.innerText = "ON"
        e.target.classList.remove("btn-danger")
        e.target.classList.add("btn-success")
    }
    else {
        e.target.innerText = "OFF"
        e.target.classList.remove("btn-success")
        e.target.classList.add("btn-danger")
    }
    await browser.storage.local.set({[name]:mod})
}

let port = browser.runtime.connect()
port.onMessage.addListener((m)=>{
    switch (m.type) {

    }
})