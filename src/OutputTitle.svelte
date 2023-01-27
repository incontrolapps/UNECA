<script>
export let content
</script>

<div class='background'>
	

<h1>

	{@html  $content.title}

</h1>
<div class="details">

<div class=block>
<b>Contact:</b><br>
<a href = "mailto:{$content.email}">{$content.name}</a>
</div>

<div class=block>
<b>Date of publication:</b><br>
{$content.date}</div>

<div class=block>
<b>Next release:</b><br>
{$content.next}
</div></div>
</div>
<br>

<style>
.background{
background-color:#023833;
color:white;

padding-top:20px;
padding-bottom:20px;
width:100%
}
	h1, .details{
max-width:800px;
margin:auto;
padding-left:20px;
padding-right:20px;
}
.details{
display: flex; 
}
.block{
	padding:10px
}
	a{
color:white;
text-decoration: underline;
}
</style>