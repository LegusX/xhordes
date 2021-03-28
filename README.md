# XHordes - A Mod Loader for Hordes.io
The new and improved XHordes, back after a *long* hiatus.

XHordes is a browser extension that allows you to download and install mods for the browser game [Hordes.io](https://hordes.io).

Current Features:
* Mod Installation from .xhordes.zip files.

## Installation
You can install it on either [Google Chrome](link) or [Firefox](link). (Other browsers may be supported in the future if there is enough demand.)
Brave and Opera users may be able to install it via the Chrome store, but it's not officially supported.

## Mod Installation
Simply visit the download link for the mod you'd like to install. If prompted, choose to save the .zip file NOT open it. The extension will then download the mod and ask for you to confirm the installation. After you do so, your mod will be loaded into the game next time you load it up!

## Mod Creation
Visit [this page](link) for instructions.

## Development
Interested in helping develop the extension? You may want to reconsider that because honestly I have no idea how to manage an open source project. If you're willing to brave my naiviety, then you're more than welcome to begin hacking away.

For testing:
```
npm run dev
```
Then you can open the extension from the folders in `build` in your browser of choice.

For building:
```
npm run build
```
The build folder will contain zip files for the different browsers. (Only difference between this and `npm run dev` is that these folders are zipped. That's it.)