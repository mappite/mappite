<?php
/* SHORT URL: generate a short url or retrieve it
 *
 * Following fragment Adapted from 
 * ShortURL (https://github.com/delight-im/ShortURL) Copyright (c) delight.im (https://www.delight.im/)
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */
 
const ALPHABET = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
//const ALPHABET = '23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ-_'; // 51
const BASE = 63; // strlen(self::ALPHABET)
function encode($num) {
	$str = '';
	while ($num > 0) {
		$str = ALPHABET[($num % BASE)] . $str;
		$num = (int) ($num / BASE);
	}
	return $str;
}
function decode($str) {
	$num = 0;
	$len = strlen($str);
	for ($i = 0; $i < $len; $i++) {
		$num = $num * BASE + strpos(ALPHABET, $str[$i]);
	}
	return $num;
}


/**

CREATE TABLE SHORTURLS (
     ID  INT UNSIGNED NOT NULL AUTO_INCREMENT,
     USER_KEY CHAR(60) NOT NULL,
     CDATE DATETIME,
     URL VARCHAR(5120),
     PRIMARY KEY (id)
);
*/

$conn = null;
include("db.php"); 

try {

	db_connect();
	//echo "Connected successfully";
	if (isset($_GET['url'])) {
		$url = $_GET['url'];
		// check if URL already exists
		$stmt = $conn->prepare("SELECT ID FROM SHORTURLS WHERE URL = :URL");
		$stmt->bindParam(':URL', $url);
		$stmt->execute();
		$result = $stmt->fetchColumn(); // NOTE: contains /alpha if generated from /alpha
		$stmt->closeCursor();
		if ($result == false) {
			$user_key = "Test";
			$stmt = $conn->prepare("INSERT INTO SHORTURLS (URL, USER_KEY, CDATE) VALUES (:url, :key, NOW())");
			$stmt->bindParam(':url', $url);
			$stmt->bindParam(':key', $user_key); // ip
			$stmt->execute();
			$last_id = $conn->lastInsertId();
			//echo "| New records created successfully: ".$last_id ; 
			echo encode($last_id);
		} else {
			echo encode($result);		
		}
		 
	} else { // assume this is a short url to retrieve
		$short = $_SERVER['PHP_SELF'];
		//echo "| php_self:".$short."| s:".$_GET['s'] ;
		$id = decode($_GET['s']);
		//echo "| Decoded: ".$id;
		$stmt = $conn->prepare("SELECT URL FROM SHORTURLS WHERE ID = :ID");
		$stmt->bindParam(':ID', $id);
		$stmt->execute();
		$result = $stmt->fetchColumn(); // NOTE: contains /alpha if generated from /alpha
		$stmt->closeCursor();
		if ($result == false) {
			echo "Page does not exists " . $short;
		} else {
			//echo "| Select query executed successfully: ".$result;
			header("Location: ".(isset($_SERVER['HTTPS']) ? "https" : "http")."://www.mappite.org".$result);
			//echo "Setting Header to: Location: ".(isset($_SERVER['HTTPS']) ? "https" : "http")."://www.mappite.org".$result;
		}
	}


} catch(PDOException $e) {
    echo "Database Failure: " . $e->getMessage();
}
$conn  = null;
?>