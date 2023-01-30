<script>
  import { writable } from 'svelte/store'
  import Sec from './Sec.svelte'
  import Box from './Box.svelte'
  import Brain from './Brain.svelte'
  import Title from './Title.svelte'
  import ButtonArray from './ButtonArray.svelte'
  import OutputTitle from './OutputTitle.svelte'
  import OutputSummary from './OutputSummary.svelte'
  import OutputSection from './OutputSection.svelte'
  import placeholders from './stories'
  import Editor from './Editor.svelte'
  const route = document.URL//"https://fa1rvwwsxx343.ons.statistics.gov.uk/TimK/UNECA/"
  import demoArticle from './demoArticle'
  let cleanSheet={
    "title": "Title*",
    "name": "Author",
    "email": "",
    "date": "TBC",
    "next": "TBC",
    "summary": "Brief summary here",
    "sections": [
        {
            "subtitle": "First section",
            "graphic": "",
            "text": "Text content",
            "embed": "",
            "download": ""
        }
    ],
    "links": [],
    "downloads": []
}

  function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

let start = "<!DOCTYPE html><html lang='en'><meta name='viewport' content='width=device-width, initial-scale=1' /><head>"
		
fetch(route+'build/bundle.js').then(res=>res.text()).then(text=>{start+="<script>" + text + "<" + "/script>";})
 // console.log(CSS)

let getCSS=()=>{let str=""; 
for(let i=0; i<document.styleSheets.length; i++)for(let ii=0; ii<document.styleSheets[i].cssRules.length; ii++)str+=(document.styleSheets[i].cssRules[ii].cssText);
return "<style>"+str+"</style>"}

let demo = true

  let makeSection = () => {
    $content.sections.push({
      subtitle: 'Section ' + ($content.sections.length + 1),
      graphic: '',
      text: '',
      embed: '',
      download: '',
    });
    sections.set($sections + 1)
}
  let lab = {
    E: [
      'title',
      'author',
      'contact email',
      'publication date',
      'next release',
      'Summary',
      'Table of contents',
      'Section',
      "<b>People have given us their data, it is our duty to give it back.</b><br><br>Your publication might change people's lives for the better - think about how to communicate the information clearly, concisely, directly and accurately.",
      'page header',
      '➕ add a section',
      'ONS-UNECA web page maker',
    ],
    F: [
      'titre',
      'auteur',
      'e-mail de contact',
      'date de publication',
      'prochaine version',
      'Résumé',
      'Table des matières',
      'Section',
      '<b>Des personnes ont donné nous leurs données, il est de notre devoir de les rendre.</b><br><br>Votre publication pourrait changer la vie des gens pour le mieux - réfléchissez à la façon de communiquer les informations de manière claire, concise, directe et précise.',
      'en-tête de page',
      '➕ ajouter une section',
      'Créateur de pages Web ONS-CEA',
    ],
    P: [
      'título',
      'autor',
      'e-mail de contato',
      'data de publicação',
      'próximo lançamento',
      'Resumo',
      'Tabela de conteúdos',
      'Seção',
      '<b>Pessoas deram nos seus dados, é nosso dever devolvê-los.</b><br><br>Sua publicação pode mudar a vida das pessoas para melhor - pense em como comunicar as informações de forma clara, concisa, direta e precisa.',
      'cabeçalho da página',
      '➕ adicionar uma seção',
      'Criador de página da Web ONS-UNECA',
    ],
    S: [
      'título',
      'autor',
      'correo electrónico de contacto',
      'fecha de publicación',
      'próximo lanzamiento',
      'Resumen',
      'Tabla de contenido',
      'Sección',
      '<b>La gente ha dado nosotros sus datos, es nuestro deber devolvérselo.</b><br><br>Tu publicación podría mejorar la vida de las personas. Piensa en cómo comunicar la información de manera clara, concisa, directa y precisa',
      'encabezado de página',
      '➕ agregar una sección',
      'Creador de páginas web ONS-UNECA',
    ],
  }

  let lang = 'E'

  let sections=writable();
  


  let addSection = () => {
    makeSection()

  }

	let content = writable()

  if (localStorage.content)
    content.set(JSON.parse(localStorage.getItem('content')))
  else {
    content.set(demoArticle)

	localStorage.setItem('content', JSON.stringify($content))
}
	$: sections.set($content.sections.length)

  $: $sections &&
    $content &&
    localStorage.setItem('content', JSON.stringify($content))
  
	
	let update = (what) => sections[what]

  let shiftUp = (ind) => {let current = JSON.stringify($content.sections[ind]); $content.sections.splice(ind,1); $content.sections.splice(ind + 1,0, JSON.parse(current))}
  let shiftDown = (s) => s
  let deleteS = (s) => s

  let files;


  function previewFile() {
  let file = document.querySelector('input[type=file]').files[0];
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    // this will then display a text file
    localStorage.content=reader.result
    location.reload();
  }, false);

  if (file) {
    reader.readAsText(file);
  }
}

</script>

<div class=page>
  <div class="top">
<h1 style:float="left" style:max-width=100%>
  {@html lab[lang][11]}
</h1> 

<button  style="height: fit-content;padding: 6px; margin-top: 20px;margin-right:5px; border-color:grey" on:click={()=>{localStorage.content=JSON.stringify(cleanSheet); location.reload(); } }>
  Clear all content
  </button>
  <button  style="height: fit-content;padding: 6px; margin-top: 20px;margin-right:5px; border-color:grey" on:click={()=>{localStorage.content=JSON.stringify(demoArticle); location.reload(); } }>
    See demo
    </button>
<label class="custom-file-upload">
<input type="file" bind:files on:change={previewFile} accept=".uneca" style="height: fit-content;padding: 6px; margin-top: 20px;" placeholder="upload previous work"/>
upload previous work
</label>
<button  style="height: fit-content;padding: 6px; margin-top: 20px;margin-right:5px; border-color:grey" on:click={()=>{let text = start + getCSS() + "</head><body style='height:initial; overflow-y:visible'>" + document.getElementById('outputFrame').innerHTML.split('<hr>')[0] + "<br><br></body>"; download("latest.uneca", localStorage.content) } }>
  Save changes for later
  </button>
  <button  style="height: fit-content;padding: 6px; margin-top: 20px;margin-right:5px; border-color:#ff7d00" on:click={()=>{let text = start + getCSS() + "</head><body style='height:initial; overflow-y:visible'>" + document.getElementById('outputFrame').innerHTML.split('<hr>')[0] + "<br><br></body>"; download("index.html", text) } }>
    Download your web page
    </button>
   
<select
  style="height:fit-content;margin-top:25px"
  name="lang"

  bind:value={lang}>
  <option value="E">🗨 ENGLISH</option>
  <option value="F">🗨 FRANÇAIS</option>
  <option value="P">🗨 PORTUGUÊS</option>
  <option value="S">🗨 ESPAÑOL</option>
</select></div>
<br style="clear:both" />
<a style="font-size:1.5em; margin-top:-30px" href="https://docs.google.com/spreadsheets/d/1VfPFMfAeJh9rW6N1xqVC_TUZQshiEK02sOCwVYMijTc/edit#gid=0">feedback here please</a>
<div class="full_content">
  <div class="half_content">
    <div class="shaded">
      <Brain />
      <p style:padding-left="10px">
        {@html lab[lang][8]}
      </p>
    </div>
    <br />

    {#if $sections && $content.title}
      <Box>
    <Editor {content} placeholder={lab[lang][0]} part="title"/>
     <!--   <textarea
		class="full"
          type="textarea"
          Placeholder="{lab[lang][0]}*"
          bind:value={$content.title} />-->
        <br />
        <input
          type="text"
          class="half"
          Placeholder={lab[lang][1]}
          bind:value={$content.name} />
        <label class="switch">
          <input type="checkbox" checked />
          <span class="slider round" />
        </label>
        <br />

        <input
          type="text"
          class="half"
          Placeholder={lab[lang][2]}
          bind:value={$content.email} />
        <label class="switch">
          <input type="checkbox" checked />
          <span class="slider round" />
        </label>
        <br />
        <label for="date">{lab[lang][3]}*</label>
        <input
          type="date"
          id="date"
          class="half"
          Placeholder="date"
          bind:value={$content.date} />
        <label class="switch">
          <input type="checkbox" checked />
          <span class="slider round" />
        </label>
        <br />
        <label for="next">{lab[lang][4]}</label>
        <input
          type="date"
          id="next"
          class="half"
          Placeholder="date"
          bind:value={$content.next} />
        <label class="switch">
          <input type="checkbox" checked />
          <span class="slider round" />
        </label>
      </Box>
      <Box {content}>
        <Title>{lab[lang][5]}</Title>
		<div 		  
		style:display="block">
    <Editor {content} placeholder={lab[lang][5]} part="summary"/>
       <!-- <textarea
          type="textarea"
		  class="full"
          Placeholder={lab[lang][5]}
          bind:value={$content.summary} />--></div>
      </Box>
      <i style:color="#999">---{lab[lang][6]}---</i>
      <br />
      <br />
      {#each Array($sections) as sec, i}
        <Box>
          <Title {content}>{lab[lang][7]} {i+1}</Title>
          <ButtonArray {content} ind={i}/>
          <Sec {lang} {sec} {content} {placeholders} {demo} index={i} />
        </Box>
      {/each}
    {/if}
    <button on:click={addSection}>{lab[lang][10]}</button>
  </div>
  <div id="outputFrame" class="half_content right">
    <OutputTitle {content} />
    <OutputSummary {content} />
    <div class="toc">

      <h3>{lab[lang][6]}</h3>
      <ol>
        {#each Array($sections) as section, i}
          <li class="bold">
            <a href="#section{i}">{$content.sections[i].subtitle}</a>
          </li>
        {/each}
      </ol>
    </div>
	{#each Array($sections) as section, index}
	<OutputSection content={$content} {index}/>
	{/each}<hr>
	<br><br><br><br><br><br>
 
    <textarea  id="download"></textarea>
  <div style:height=300px > End</div>

</div>
</div>
</div>
<style>

input[type="file"] {
    display: none;
}

.custom-file-upload {
    cursor: pointer;
    height: fit-content;
    padding: 6px;
    margin-top: 20px;
    border: 5px solid grey;
    margin-right:5px
}

  .top{
    display: flex;
    justify-content: space-between;
    align-content: center;
  }
	.page{height:100vh;
	display:flex;
flex-direction: column;}
	.bold {
	  font-weight: bold;
	  font-size: 18px;
	}
	.full_content {

	  height: 100vh;
	  overflow: hidden;

	}
  
.half_content {
	  width: calc(50% );
	  height: 100%;
	  overflow: scroll;
	  float: left;
	}

	.right {
	  display: flex;
	  flex-direction: column;
	}
	:global(.half) {
	  width: 50%;
	}
	:global(.full) {

	}	
	button {
	  border: 5px solid gold;
	}
	label {
	  color: #666;
	}
  
	:global(hr) {
	  height: 10px;
	  background-color: #c7ebf1;
	  border: none;
	  border-radius: 10px;
	}
	.shaded {
	  border-top: 10px solid gold;
	  border-bottom: 10px solid gold;
	  padding: 10px;
	  display: flex;
	  max-height: 200px;
	}
  
	/* The switch - the box around the slider */
	.switch {
	  position: relative;
	  display: inline-block;
	  width: 60px;
	  height: 30px; /*34*/
	  margin-top: -40px;
	}
  
	/* Hide default HTML checkbox */
	.switch input {
	  opacity: 0;
	  width: 0;
	  height: 0;
	}
  
	/* The slider */
	.slider {
	  position: absolute;
	  cursor: pointer;
	  top: -5px;
	  left: 5px;
	  right: -5px;
	  bottom: 5px;
	  background-color: #ccc;
	  -webkit-transition: 0.4s;
	  transition: 0.4s;
	}
  
	.slider:before {
	  position: absolute;
	  content: '';
	  height: 22px;
	  width: 22px;
	  left: 4px;
	  bottom: 4px;
	  background-color: white;
	  -webkit-transition: 0.4s;
	  transition: 0.4s;
	}
  
	input:checked + .slider {
	  background-color: gold;
	}
  
	input:focus + .slider {
	  box-shadow: 0 0 1px #2196f3;
	}
  
	input:checked + .slider:before {
	  -webkit-transform: translateX(30px);
	  -ms-transform: translateX(30px);
	  transform: translateX(30px);
	}
  
	/* Rounded sliders */
	.slider.round {
	  border-radius: 34px;
	}
  
	.slider.round:before {
	  border-radius: 50%;
	}
  
  .toc{
    width: calc(100% - 50px);
    max-width: 800px;
    margin: auto;
    padding-left: 20px;
    padding-right: 20px;
    text-align: left;
}

	:global(.gold){
		color:gold;
		height:2em;
	}

	:global(iframe){
		overflow:hidden;
		border: none;
	}
  </style>