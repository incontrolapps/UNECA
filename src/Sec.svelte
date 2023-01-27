<script>

	import Slider from './Slider.svelte'
	export let lang, index, content;


		let lab={
			E:["subtitle","optional decorative graphic","text content", "embed code for chart or table", "URL for data download"],
			F:["sous-titre", "graphique décoratif facultatif", "contenu textuel", "code d'intégration pour le graphique ou le tableau", "URL de téléchargement des données"],
			P:["legenda","gráfico decorativo opcional","conteúdo de texto", "código incorporado para gráfico ou tabela", "URL para download de dados"],
			S:["subtítulo","gráfico decorativo opcional","contenido de texto", "código incrustado para gráfico o tabla", "URL para descarga de datos"]
			}
console.log("content",$content, "index", index)
</script>
{#if $content.sections[index]}
<p class="full">{lab[lang][0]}</p>
	<textarea type="textarea"  class="full" bind:value={$content.sections[index].subtitle}/>
	<p class="full">{lab[lang][1]}</p>
	
	<input class="half" type="text" Placeholder="{lab[lang][1]}" bind:value={$content.sections[index].graphic}/><Slider/>
	<p class="full">{lab[lang][2]}</p>	
	<textarea class="full" type="textarea" style:width=100% Placeholder="{lab[lang][2]}" bind:value={$content.sections[index].text}/>
	<p class="full">{lab[lang][3]}</p>	
	<textarea class="full" type="textarea" style:width=100% Placeholder="{lab[lang][3]}" bind:value={$content.sections[index].embed}/>
	<p class="full">{lab[lang][4]}</p>	
	<input type=text class="half" Placeholder="{lab[lang][4]}" bind:value={$content.sections[index].download}/>
	<Slider/>
	
	<br>
{/if}

<style>
	p.full{
		margin-bottom: 0;
	}
</style>