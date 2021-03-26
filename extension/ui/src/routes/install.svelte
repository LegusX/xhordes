<script>
    import {onMount} from "svelte"
    import { fs, configure } from "@zip.js/zip.js";

    let manifest = {}
    let icon
    onMount(()=>{

    })
    async function getMod() {
        return new Promise(async(res,rej)=>{
            if (window) {
                let url = location.href.split("?")[1]
                if (url !== "") {
                    //download file, unzip it, and pull out the manifest and the
                    let fs = zip.fs.FS()
                    await fs.root.importHttpContent(url)
                    let file = await fs.find("manifest.json")
                    manifest = JSON.parse(await file.getText())

                    //look to see if there was an icon specified
                    if (manifest.icon) {
                        let raw = await fs.find(manifest.icon)
                        let blob = await raw.getBlob()
                        icon = URL.createObjectURL(blob)
                    }
                    res()
                }
                else rej("No url provided")
            }
            else rej()
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
</script>
<head>
    <title>Install New Mod - XHordes</title>
</head>
<style>
    .outer {
        margin-top:15vh;
    }

</style>

{#await getMod()}
    <h3 style="text-align:center;">Fetching Mod...</h3>
{:then}
    <div class="container outer">
        <div class="main">
            <h2>Mod Installer</h2>
            <hr>
            <h4>{manifest.name}</h4>
            <h5>By {manifest.author}</h5>
            <a href={manifest.home}><h5>Home Page</h5></a>
            {#if icon}
                <img src={icon} alt="Mod Icon">
            {/if}
            <p>{manifest.description}</p>
            <hr>
            <p>Are you sure you want to install this mod?</p>
            <button class="btn btn-warning" on:click={install}>Install Mod</button>
            <button class="btn btn-danger" on:click={()=>window.close()}>Cancel</button>
        </div>
    </div>
{:catch error}
    <h3>{error}</h3>
{/await}