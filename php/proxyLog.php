<?php

/**
 * Proxy to bypass CORS on AJAX calls - let server to retrieve it.
 *
 * This is an implementation of a transport channel for utilizing cross-domain
 * AJAX calls. This script is passed the data through AJAX along with two special
 * hidden field containing the action URL and the http method (GET/POST). It then  
 * sends the form fields to that URL and returns the response.
 *
 * @package		CrossDomainAjax
 * @category	CURL
 * @author		Md Emran Hasan <phpfour@gmail.com>
 * @author		Lambertus IJsseltein (security fix -> allowed domains)
 * @link		http://www.phpfour.com
 */

// The domains/page we're allowed to contact
$allowedDomains = array('http://api.geonames.org/wikipediaBoundingBoxJSON', 'https://share.garmin.com/Feed/Share/', 'xxxx://openls.geog.uni-heidelberg.de/', 'xxxx://yournavigation.org/');

// Get URL to fetch
$theUrl = $_REQUEST['url'];

// Variable State if fetch methos is via GET or POST -- NOT USED
$method = $_REQUEST['method'];


// Check the url for allowed domains
$fail = true;
foreach ($allowedDomains as $domain) {
    if (strpos(substr($theUrl, 0, strlen($domain)), $domain) !== false) {
        $fail = false;
	break;
    }
}

// exit if domain is not in the list
if ($fail == true) {
    exit("Domain name '".$theUrl."' not allowed. Access denied.");
    logme("Domain name '".$theUrl."' not allowed. Access denied.");
}

$fields = '';

// For POST url fetch , prepare the fields for query string, don't include the action URL OR method -- NOT USED
if (count($_GET) > 1) {
    foreach ($_GET as $key => $value) {
        if ($key != 'url' && $key != 'method') {
            $fields .= $key . '=' . rawurlencode($value) . '&';
        }
    }
} 

// Strip the last comma
$fields = substr($fields, 0, strlen($fields) - 1);

// Initiate cURL
$ch = curl_init();

// Do we need to POST of GET ?
if (strtoupper($method) == 'POST') {
    curl_setopt($ch, CURLOPT_URL, $theUrl);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
    logme('POST '.$theUrl);
}
else {
    curl_setopt($ch, CURLOPT_URL, $theUrl . '?' . $fields);   
    logme('GET '.$theUrl . '?' . $fields);
}

// Follow redirects and return the transfer
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);

curl_setopt($ch, CURLOPT_USERAGENT, "mappite.org (CURL)");
 
// Get result and close cURL
$result = curl_exec($ch);

$curl_info = curl_getinfo($ch);

curl_close($ch);

// Return the response
header("Content-type: ".$curl_info['content_type']);
//header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
echo $result;

function logme($log_msg) {
    $log_time = date('Y-m-d h:i:sa');
    if (!file_exists($log_filename)) {
        // create directory/folder uploads.
        mkdir($log_filename, 0777, true);
    }
    $log_file_data = 'log_' . date('Y-M-d') . '.log';
    file_put_contents($log_file_data, $log_time.' '.$log_msg . '\n', FILE_APPEND);
}
?>
