<!DOCTYPE html>
<html>
<head>

	<title>
	<?php
	$name = $_GET['name'];
	if (isset($_GET['distance'])) {
	    $name = $name." (".$_GET['distance'].")";
	}
	?></title>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<meta name="description" content="<?php echo $_GET["description"] ?>"/>
	<meta name="keywords" content="mappite map route gpx garmin navigator openstreetmap osm motorbike"/>
	<link rel="icon" href="./mappiteLogo.png">
	<!-- meta property='og:title' content='mappite easily create&share routes'/ -->
	<meta name="robots" content="noindex">	
	<meta content="<?php echo $name ?>" itemprop="name" property="og:title"> 
        <meta content="mappite - orig ogsite_name" property="og:site_name"> 
	<meta property='og:image' content='http://www.mappite.org/mappite.jpeg'/>
	<meta property='og:type' content='website'/>
	<?php
		$url = (isset($_SERVER['HTTPS']) ? "https" : "http")."://".$_SERVER["HTTP_HOST"].((substr($_SERVER['REQUEST_URI'],0,6) == "/alpha")?"/alpha/?":"/?").$_SERVER['QUERY_STRING'];
	?>
	<?php 
	// avoif facebook useragent to redirect and foll the title...
	$agent = $_SERVER['HTTP_USER_AGENT'];
	if(!stristr($agent, 'FacebookExternalHit')){ 
	?>
		<meta http-equiv="refresh" content="0; url=<?php echo $url ?>" >
	<?php } ?>

	
 
<!-- script>
  window.location.href = "http://www.mappite.org/?<?php echo $_SERVER['QUERY_STRING'] ?>"
</script -->

</head>
<body>
<a href="http://www.mappite.org/?<?php echo $_SERVER['QUERY_STRING']?>">mappite.org</a>
<!--
 <?php echo $_SERVER["HTTP_HOST"]; ?>/?<?php echo $_SERVER['QUERY_STRING'] ?>
-->	
</body>
</html>
