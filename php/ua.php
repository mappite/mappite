<?php
/**
 * Add a User - ua.php?aemail=eliboni@gmail.com&apwd=xxxxx&nemail=XXX&npwd=YYYY
 
	NOTE: not used anymore since user creation happens via paypal script
	      or by
		INSERT INTO `USERS`(`EMAIL`, `LANG`, `PWD`,`TOKEN`, `TOKEN_DATE`, `CREATION_DATE`) VALUES ('email@mail.com', 'IT', 'ssffsfsf','sdfsfsdf',now(),now())
	      and then issuing a password reset to let the user receive a new link to change password.
		
	
 */
 
$conn = null;
include("db.php"); 

try {
	if (isset($_POST['aemail'])) { // basic check on argument
		header("Content-Type:application/json; charset=utf-8");
		db_connect();
		if (validateAdmin($_POST['aemail'], $_POST['apwd'])) { 
			createUser($_POST['nemail'], $_POST['npwd'], $_POST['nlang']);
			echo '{"status": "User Created"}';
			// code to send email goes here
		} else {
			echo '{"status": "Unauthorized"}';
		}
	} else {
		header("Content-Type:text/html; charset=utf-8");
		?>
		<html><title>Supernice Form</title>
		<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
		<style type="text/css">
		input {
			height: 30px;
			border: 3px solid #EBE6E2;
			border-radius: 5px;
			transition: all 0.3s ease-out;
			background-color:rgba(0, 0, 0, 0);
			font:  bold 16px 'Open Sans',sans-serif;
			color: #1B76C8;
		}
		input:focus {
			border-color: #BBB;
			background-color:rgba(255, 255, 255, 1);
			outline: none;
		}
		</style>
		</head>
		<body>
		<form method="POST">
		<table><tr><td>
		<tr><td>Admin</td><td> <input name="aemail" type="text" size="20" ></td></tr>
		<tr><td>Pwd</td><td> <input name="apwd" type="password" ></td></tr>
		<tr><td>Email</td><td> <input name="nemail" type="text" ></td></tr>
		<tr><td>Pwd</td><td> <input name="npwd" type="text" ></td></tr>
		<tr><td>Lang</td><td> <input name="nlang" type="text" size="2" value="IT"></td></tr>
		</table>
		<input type="submit" value="Submit">
		</form>
		</body></html>
		<?
	
	}
} catch(PDOException $e) {
	echo '{"status": "Exception", "exception": "' . $e->getMessage() . '"}';
}

$conn  = null; // terminate connection

function createUser($email, $pwd, $lang) {
	global $conn;
	$email = $email.trim();
	$pwd = $pwd.trim();
	$stmt = $conn->prepare('INSERT INTO `USERS` (`EMAIL`, `PWD`, `TOKEN`, `LANG`, `TOKEN_DATE`, `CREATION_DATE`) VALUES (:email, MD5(:pwd), :token, :lang, now(), now())');
	$stmt->bindParam(':email', $email); 
	$stmt->bindParam(':pwd' , $pwd);
	$randomToken= bin2hex(random_bytes(10)).uniqid();
	$stmt->bindParam(':token' , $randomToken );
	$stmt->bindParam(':lang' , $lang);
	$stmt->execute();
}

function validateAdmin($email, $pwd) {
	global $conn;
	$stmt = $conn->prepare("SELECT USER_ID FROM USERS WHERE EMAIL=:email AND PWD = MD5(:pwd) AND TYPE = 'A'");
	$stmt->bindParam(':email', $email); 
	$stmt->bindParam(':pwd' , $pwd);
	$stmt->execute();
	$result = $stmt->fetchColumn();
	$stmt->closeCursor();
	if ($result == false) { 
		return false; 
	} else { 
		return true; 
	}
}


//$email = $_REQUEST['email'];
//$key = hash('md5', ($email .base64_encode(random_bytes(10))));
	
?>
