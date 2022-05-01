<?php

/**
 * Proxy & Cache a JSON Url
 * 
 * 'url' = <string>the url to fetch 
 * 'method' = GET||POST state if the url shall be retrieved via get or post
 * 'cache' = <string> cache key used to cache the content
 * . any other fields is passed to the get or post request
 *
 * Note: update $allowedDomains array to state which urls can be used
 */
 
// The domains/page we're allowed to contact
$allowedDomains = array(  'https://graphs.mappite.com/route', 'https://routing.mappite.com/route','http://api.geonames.org/wikipediaBoundingBoxJSON', 'https://open.mapquestapi.com/directions', 'https://api.openrouteservice.org/v2/');

// Get URL to fetch
$url = $_REQUEST['url'];
$http_code = "200"; // expected http_code from cUrl

//echo $url;
//exit("");

function fetchJsonUrl($url) {
	// "method" determines if url needs to be fetch via GET or POST
	$method = $_REQUEST['method'];
	// For POST url fetch , prepare the fields for query string, don't include the action URL OR method OR chace
	$fields = '';
	
	if (count($_REQUEST) > 2) { // build new query string in $fields removing pc.php specific items (url, method & cache)
	    //
	    $q_get  = explode('&', $_SERVER['QUERY_STRING']);
	    foreach( $q_get as $param ) {
		  list($key, $value) = explode('=', $param, 2);
		  if ($key != 'url' && $key != 'method' && $key != 'cache') {
			$fields .= $key . '=' . rawurlencode(urldecode($value)) . '&';
		  }
	    }
	    
	    /*foreach ($_GET as $key => $value) { // UPDATED _GET since $_REQUEST['options'] creates troubles
		if ($key != 'url' && $key != 'method' && $key != 'cache') {
		    $fields .= $key . '=' . rawurlencode($value) . '&';
		}
	    } */
	}

	// Strip the last &
	$fields = substr($fields, 0, strlen($fields) - 1);
	
	//echo $url . '?' . $fields;
	//return;
	
	// Initiate cURL
	$ch = curl_init($url . '?' . $fields); // GET params are passed in case of POST as well
	//header("my_url: ".$url);
	//header("my_fields: ".$fields);
	
	// Handle POST (ORS v2 etc)
	if (strtoupper($method) == 'POST') {

   	    //curl_setopt($ch, CURLOPT_URL, $url); //+'?'+$fields); // you can't pass ?key=val in CURLOPT_URL!!!
	    curl_setopt($ch, CURLOPT_POST, 1);
	    $json_data = file_get_contents('php://input');
	    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
	    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));//, 'Content-Length: ' . strlen($json_data)));
	    //header("php_input: ".$json_data); // echo back for debug
	} else { // Works for any GET request
	    //curl_setopt($ch, CURLOPT_URL, $url . '?' . $fields);   
	}

	// Follow redirects and return the transfer
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
	curl_setopt($ch, CURLOPT_USERAGENT, "mappite.org (CURL)");
	 
	// Get result and close cURL
	$result = curl_exec($ch);

	$curl_info = curl_getinfo($ch);
	header("Content-type: ".$curl_info['content_type']);	
	
	$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	//$curl_err = curl_error($ch);
	//header("cURL_err: ".$curl_err);	
	curl_close($ch);
	
	return $result;

}


/* Check the url for allowed domains and abort if not the case */
$fail = true; ///////////////////////////////////////////////////////// SET TO TRUE
foreach ($allowedDomains as $domain) {
    if (strpos(substr($url, 0, strlen($domain)), $domain) !== false) {
        $fail = false;
	break;
    }
}
if ($fail == true) {
    echo "Failed.";
    exit("Domain name '".$url."' not allowed. Access denied.");
}

// header('Access-Control-Allow-Origin: *'); // for dev... SECURITY ISSUE SHOULD REMOVE IN PROD // not needed unless mixing local dev and remote php


/* If cache is enable, try to get from cache */
if (isset($_REQUEST['cache'])) { // Use cache

    //$url = filter_var($_POST["url"], FILTER_SANITIZE_URL); // Be careful with posting variables.
    
    $cache_key = $_REQUEST['cache'];
    $cache_file = "cache/".hash('md5', $cache_key).".json";

    if (file_exists($cache_file) && (filemtime($cache_file) > (time() - 86400*3 ))) { // 86,400 seconds = 24 hours.
      // If the file exists and was cached in the last xxx hours...
      header('Cache_Mappite: HIT');
      header("Content-Type: application/json"); // set type for the json file
      echo file_get_contents($cache_file); // Get the file from the cache and echo it
      
    } else {
      // Cache Miss
      //ob_start(); // buffer incoming output
      header('Cache_Mappite: MISS');
      $result = fetchJsonUrl($url); // Fetch the url
      echo $result; // content and echo it
      // cache file if fetchJsonUrl succeeded
      if ($http_code = "200") { 
	file_put_contents($cache_file, $result, LOCK_EX); // Save it for the next requestor. 
      }
    }
} else {  
    echo fetchJsonUrl($url); // Fetch the url
}

// Return the response - moved above with echo to optimize performance w/o waiting the fiel to be written on disk // does not work...
//echo $result;

?>
