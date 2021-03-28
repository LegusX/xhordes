<script>
	import MdSettings from 'svelte-icons/md/MdSettings.svelte'
	export let segment;
</script>

<style>
	.settings {
		width:32px;
		height:32px;
		text-align:right;
		margin-top:0.3%;
		position:absolute;
		right:1em;
	}
</style>

	<ul class="nav nav-tabs">
		<li class="nav-item"><a class="nav-link {segment === undefined ? 'active' : undefined}" aria-current="{segment === undefined ? 'page' : undefined}" href=".">Home</a></li>
		<li class="nav-item"><a class="nav-link {segment === "mods" ? 'active' : undefined}" aria-current="{segment === 'mods' ? 'page' : undefined}" href="mods">Mods</a></li>
		<div class="settings">
			<a class="" aria-current="{segment === 'mods' ? 'page' : undefined}" href="settings"><MdSettings/></a>
		</div>
	</ul>
