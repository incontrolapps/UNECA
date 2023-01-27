<script>
    export let content, index
</script>
<div id="section{index}" class="section" >
<h2>{index+1}. {content.sections[index].subtitle}</h2>

<div>
    {#if content.sections[index].graphic}
    <img class="pic" src="{content.sections[index].graphic}" alt=""/><br><br>
    {/if}
    {@html content.sections[index].text}</div>
    {@html content.sections[index].embed}
</div>
<style>
    .section{
        font-size: 18px;
        width:calc(100% - 50px);
		max-width:800px;
		margin:auto;
		padding-left:20px;
		padding-right:20px;
        text-align:left;
    }
    .pic{max-height:300px}
</style>