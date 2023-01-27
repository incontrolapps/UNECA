<script>
export let content
</script>

<div class='background'>
	

<h1>

	{$content.title}

</h1><br>
<div class="details">

<b>Contact:</b><br>
<a href = "mailto:{$content.email}">{$content.name}</a><br><br>
<b>Date of publication:</b><br>
{$content.date}<br><br>
<b>Next release:</b><br>
{$content.next}
</div>
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
width:800px;
margin:auto;
padding-left:20px;
}
	a{
color:white;
text-decoration: underline;
}
</style>