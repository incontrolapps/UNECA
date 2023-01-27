<script>
  export let content, ind

  let shiftUp = () => {
	let arr = $content.sections
	if(arr){
	[arr[ind], arr[ind -1]] = [arr[ind -1], arr[ind]];
	$content.sections = arr;
	console.log($content.sections)
  }}

  let shiftDown = () => {
	let arr = $content.sections
	if(arr){
	[arr[ind], arr[ind +1]] = [arr[ind +1], arr[ind]];
	$content.sections = arr;
	console.log($content.sections)
  }}

  let del = () => {
	let arr = $content.sections
	if(arr){
	arr.splice(ind, 1)
	$content.sections = arr;
	console.log($content.sections)
  }}
</script>

<style>
  .section-controls {
    float: right;
  }
  button {
    width: 30px;
    height: 30px;
    border-radius: 5px;
  }
</style>

<span class="section-controls">
  <button on:click={del}>✖</button>
 {#if ind>0} <button on:click={shiftUp}>⇪</button>{/if}
 {#if ind< $content.sections.length-1} 
 <button on:click={shiftDown}>
    <span
      style="transform:rotate(180deg); display: inline-block;
      vertical-align:middle">
      ⇪
    </span>
  </button>{/if}
</span>

