# Extension UI

UI is based off of [svelte/sapper](https://sapper.svelte.dev/) and is built using 
~~~
npm run export
~~~

It is however, included in the root package.json as part of `npm run build`, so if you're building the extension, you can probably just use that command instead.

For development just run ```npm run dev``` in this directory. I've not set up extensions reloading stuff, so you'll have to test everything as a webpage, and not an extension popup (Unless you're okay with rebuilding the extension every time)