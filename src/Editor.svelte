<script>
  import { onMount } from 'svelte';
import Quill from './quill';
let editor
export let content, placeholder, part="x", type, subPart
onMount(async () => {
    
      let quill = new Quill(editor, {
        modules: {
          toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        ["link"],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }]
      ]
        },
        theme: "snow",
        placeholder: placeholder
      });

      if(type=="section" ){quill.root.innerHTML = $content.sections[part][subPart]}
      else quill.root.innerHTML = $content[part];

     quill.on("text-change", function(delta, oldDelta, source) {
      let newHTML=editor.getElementsByClassName('ql-editor')[0].innerHTML
      if (type=="section"){$content.sections[part][subPart]=newHTML}
      else {$content[part]=newHTML}

  });

    });

  </script>

    <div class="editor-wrapper">
    <div bind:this={editor} />
  </div>