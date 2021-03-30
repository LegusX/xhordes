//make the code platform agnostic
// I should be okay without this now that I'm using the polyfill, but keeping it just in case
if (typeof browser === "undefined") browser = chrome

var currentTab = "home"
const port = browser.runtime.connect()

//from https://stackoverflow.com/a/7180095
Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

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
        div.id = name

        //on/off button
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
        author.classList.add("author")
        div.appendChild(author)

        //mod ordering arrows
        let up = document.createElement("button")
        up.innerHTML = "&#9650;"
        up.classList.add("arrowup")
        up.classList.add("btn")
        up.addEventListener("click", sort)
        up.setAttribute("mod", name)
        div.appendChild(up)

        let down = document.createElement("button")
        down.innerHTML = "&#9660;"
        down.classList.add("arrowdown")
        down.classList.add("btn")
        down.addEventListener("click", sort)
        down.setAttribute("mod", name)
        div.appendChild(down)

        if (mod.short) {
            let short = document.createElement("p")
            short.innerText = mod.short
            div.appendChild(short)
        }

        let hr = document.createElement("hr")
        div.appendChild(hr)

        //add context menu to div
        div.addEventListener("contextmenu", (e)=>{
            e.preventDefault()
            new Contextual({
                width:"200px",
                items: [
                    {label:"Uninstall", onClick: ()=>{uninstall(name)}}
                ]
            })
        })

        //finally append this whole thing to the mods div
        modDiv.appendChild(div)

        if (mod.enabled) {
            //figure out how many mods are enabled
            enabled++
        }
    }

    if (modList.length == 0) {
        let nomods = document.createElement("p")
        nomods.innerHTML = "It looks like you don't have any mods installed! Check out the <a href='https://discord.gg/y9YS633r5p'>Discord Server</a> for a list of mods! (Note that no such list actually exists, but there will be one eventually)"
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

async function sort(e) {
    let arrow = e.target
    let name = arrow.getAttribute("mod")
    let data = await browser.storage.local.get("modList")
    let modList = data.modList

    //change the order in the storage and in the mods div
    if (arrow.classList.contains("arrowup")) {
        if (modList.indexOf(name) === 0) return //mod is already at the top so it can't go any higher
        let modDiv = document.getElementById(name)
        document.getElementById("mods").insertBefore(modDiv, modDiv.previousSibling)
        modList.move(modList.indexOf(name), modList.indexOf(name)-1)
    }
    if (arrow.classList.contains("arrowdown")) {
        if (modList.indexOf(name) === modList.length-1) return //mod is already at the bottom so it can't go any lower
        let modDiv = document.getElementById(name)
        document.getElementById("mods").insertBefore(modDiv, modDiv.nextSibling.nextSibling)
        modList.move(modList.indexOf(name), modList.indexOf(name)+1)
    }
    await browser.storage.local.set({modList})
}

async function uninstall(name) {
    //remove from modList
    let data = await browser.storage.local.get("modList")
    let modList = data.modList
    modList.splice(modList.indexOf(name), 1)
    await browser.storage.local.set({modList})

    //remove from dom
    document.getElementById(name).parentElement.removeChild(document.getElementById(name))

    //if there are no mods left then put the "find more mods" message back
    if (modList.length === 0) updateModList()
}

port.onMessage.addListener((m)=>{
    switch (m.type) {
        case "uninstalled":
            //might put some sort of pop up here eventually
            break;
    }
})
