const fs = require('fs-extra')
const zip = require("simple-folder-zip").default

//random constants
const BROWSERS = fs.readdirSync("browsers").filter(x=>x!=="README.md") //include any paths that aren't the readme file
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose")
const DEV = process.argv.includes("-d") || process.argv.includes("--dev")
const IGNORE = fs.readFileSync(".ignore", "utf-8").split("\n") //figure out what files/directories to not include in the extension

//Just to make the console a bit less spammy
console.verbose = function(log) {
    if (VERBOSE) console.log(log)
}

console.verbose("Ignoring files/directories:")
console.verbose(IGNORE)

//builds for a given browser if its manifest exists in ./manifests/
async function build(browser) {
    console.log("Beginning build for "+browser)
    if (!fs.existsSync(`./browsers/${browser}`)) throw new Error(`Browser specific folder doesn't exist!`)

    //Delete tmp and recreate the folder (in case previous process got interrupted)
    reset("tmp")

    //copy over the relevant files to tmp
    var paths = fs.readdirSync("./")
    var filtered = paths.filter(x=>!IGNORE.includes(x))

    for (path of filtered) {
        fs.copySync("./"+path, "./tmp/"+path)
        console.verbose(`Copied ./${path} to ./tmp/${path}`)
    }

    //copy over browser specific code
    fs.copySync(`./browsers/${browser}`, "./tmp/")
    console.verbose("Copied browser specific files for "+browser)

    //copy over the ui files to root instead of their own folder
    fs.copySync("ui", "tmp")
    console.verbose("Copied the UI files")

    if (!DEV) {
        //finally zip it all up
        console.verbose("Zipping file...")
        await zip("./tmp", `./builds/${browser}.zip`)
        console.log(`${browser}.zip has been written to ./builds`)
    }
    else {
        //copy files into a plain folder for quick reloading in browsers
        fs.mkdirSync(`builds/${browser}`)
        fs.copySync("tmp", `builds/${browser}`)
    }
}

//delete folder and then recreate it but empty
function reset (folder) {
    let dir = "./"+folder
    if (fs.existsSync(dir)) { 
        console.verbose(`Found existing ${folder} folder, deleting...`)
        fs.rmdirSync(dir, { recursive: true });
        console.verbose(`Deleted ${folder} folder.`)
    }
    fs.mkdirSync(dir)
    console.verbose(`Created ${folder} folder.`)
}

//wrapping this in a function so that we can use await
async function start() {
    console.log("Beginning build.")
    let startTime = Date.now()

    reset("builds")

    //go through the supported browsers and build
    for (browser of BROWSERS) {
        await build(browser)
    }

    //remove tmp
    console.log("Cleaning up...")
    if (fs.existsSync("./tmp")) { 
        fs.rmdirSync("./tmp", { recursive: true });
        console.verbose(`Deleted tmp folder.`)
    }
    console.log(`Build finished in ${Date.now()-startTime} ms.`)
}

start()
