<?php
/**
 * Database Connection
 */
function db_connect() {
	global $conn;
	$servername = "__servername__";
	$username = "__username__";
	$password = "__password__";
	$conn = new PDO("mysql:host=$servername;dbname=__dbname__;port=__port__;charset=utf8",$username, $password); // ,
	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
// make sure do not leave any blank or carriage return after or before php closing tag
?>