<script>
	import Nav from '../components/Nav.svelte';

	export let segment;
</script>

<style>

</style>

<!-- Don't want to give the install page the nav bar -->
{#if segment !== "install"}
	<Nav {segment}/>
{/if}

<main>
	<slot></slot>
</main>