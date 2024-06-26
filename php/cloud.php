<?php
/**
 * Enroll/Unenroll and Route management (save, delete, get) in cloud
 */
 
header("Content-Type:application/json; charset=utf-8");

$conn = null;
include("db.php"); 

$tokenDate = "false";

if (isset($_REQUEST['action'])) {
 $action = $_REQUEST['action'];
 
 if ($action == "restore") {
 
  if ( isset($_COOKIE['_mappite_token']) && $_COOKIE['_mappite_token'] != 'bye')  {
	echo '{"status": "ok"}'; 
	// _mappite_token exists as an https cookie, check if not 'bye' to make sure this works also if the browser did not delete it yet after unenroll
  } else { 
	echo '{"status": "invalid"}'; 
  }
  
 } else { // need to connect to db for the remaining actions
	 
	 try {
		db_connect();
		
		if ( $action == "enroll") {
			if (enroll($conn) ) {
				echo '{"status": "ok"}'; // _mappite_token is set
			} else {
				echo '{"status": "invalid", "email": "'.$_REQUEST['email'].'", "tokenDate": "'.$tokenDate.'"}';
			}
		} else if ( $action == "resetPwd") {
			$res = resetPassword($conn);
			echo '{"status": "ok"}'; // always answer ok, don't let to spoof email addresses
		} else if ( validateToken($conn) ){
			$json = '"status": "ok"';
			$json = $json. ', "tokenDate" : "'.$tokenDate.'"';
			switch ($action) {

				case "saveRoute":
					if (saveRoute($conn)) {
						$json = $json. ', "result": "routeUpdated"';
						//$json = $json. ', "url": "'.$_REQUEST['url'].'"';
					} else {
						$json = $json. ', "result": "routeInserted"';
					}
				break;
				case "deleteRoute":
					if (deleteRoute($conn)) {
						$json = $json. ', "result": "routeDeleted"';
					} else {
						$json = $json. ', "result": "routeDoesNotExist"';
					}				
				break;
				case "unenroll":
					setcookie('_mappite_token','bye',time()-3600,null,null,false, true); // HTTP ONLY, note this will differe in https and http...
				break;
				case "getRoutes":
					$json = $json. ', '. getRoutes($conn);
				break;
				default:
					$json = $json. ', "result": "unknownAction"';
			}
			echo '{'.$json.'}';
		} else {
			echo '{"status": "invalidToken", "tokenDate": "'.$tokenDate.'"}';
		}
		

	 } catch(PDOException $e) {
	   echo '{"status": "Exception", "exception": "' . $e->getMessage() . '"}';
	 }
 }
}

$conn  = null;

function enroll($conn) { 
	$email = filter_var(strtolower($_REQUEST['email']), FILTER_SANITIZE_EMAIL); // return false if invalid
	$stmt = $conn->prepare("SELECT TOKEN, DATE_FORMAT(TOKEN_DATE, '%Y/%m/%d') 'TOKEN_DATE', TYPE FROM USERS WHERE PWD = MD5(:pwd) AND EMAIL=:email");
	$pwd = $_REQUEST['pwd'];
	$stmt->bindParam(':pwd', $pwd);
	$stmt->bindParam(':email', $email );
	$stmt->execute();
	
        if ($result = $stmt->fetch(PDO::FETCH_ASSOC)) { // user exists
		$stmt->closeCursor();
		$userType = $result["TYPE"];
	        $token = $result["TOKEN"];
		global $tokenDate;
		$tokenDate = $result["TOKEN_DATE"]; // it's a string
		if ($tokenDate > date("Y/m/d", strtotime("-15 months")) || $userType == 'L' || $userType == 'A') {
			setcookie('_mappite_token',$token,time()+86400*365,null,null,false, true); // token has been set in http_only cookie for 1 yr
			$_SESSION['token'] = 'valid'; 
			return true; 
		}
	} 
	
	return false; 

}


function resetPassword($conn) {
	// check if email exists
	$email = filter_var(strtolower($_REQUEST['email']), FILTER_SANITIZE_EMAIL); // return false if invalid
	$stmt = $conn->prepare("SELECT EMAIL FROM USERS WHERE EMAIL=:email");
	$stmt->bindParam(':email', $email );
	$stmt->execute();
	$result = $stmt->fetchColumn();
	$stmt->closeCursor();
	
	if ($result == false) { 
		return 0; 
	} else { 
		// generate temp password
		$tmpPwd= bin2hex(random_bytes(10));
		// update tmppwd and tmppwd_date
		$stmt = $conn->prepare("UPDATE USERS SET TMPPWD = :tmpPwd , TMPPWD_DATE = now() WHERE EMAIL=:email");
		$stmt->bindParam(':tmpPwd', $tmpPwd );
		$stmt->bindParam(':email', $email );
		$stmt->execute();
		if ($stmt->rowCount() == 1){
			// email with link to dedicated form where to enter new password
			
			$subject = "Mappite - Password Reset";
			$message = "<html><head><title>Mappite.org - Password Reset</title></head><body><p>Click within 12 hours <br/>Click entro 12 ore<br/>".
			 "Klicken Sie innerhalb von 12 Stunden<br/>Cliquez dans les 12 heures<br/>Clic dentro de las 12 horas<br/></p>".
			 "<p>  <a href='https://mappite.org/up.php?tmpPwd=".$tmpPwd."' target='_blank'>https://mappite.org/up.php?tmpPwd=".$tmpPwd."</a></p><br/></body></html>";
			$headers = "MIME-Version: 1.0" . "\r\n";
			$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
			$headers .= 'From: <info@mappite.org>' . "\r\n";
			//$headers .= 'Cc: myboss@example.com' . "\r\n";
			mail($email,$subject,$message,$headers);
			return 1; 
		} else {
			return -1; 
		}
	}
}

function validateToken($conn) {
	if ($_SESSION['token'] != 'valid') { // we need to start session session_start(); this is always != for now !!!!! FIXME and consider what happen when one unenrolls
		$token = $_COOKIE['_mappite_token'];
		
		if (!isset($token) ) return false; // avoid a db query
		
		$stmt = $conn->prepare("SELECT DATE_FORMAT(TOKEN_DATE, '%Y/%m/%d') 'TOKEN_DATE', TYPE FROM USERS WHERE TOKEN = :token");
		$stmt->bindParam(':token', $token);
		$stmt->execute();
		if ($result = $stmt->fetch(PDO::FETCH_ASSOC)) { // user exists
			$stmt->closeCursor();
			$userType = $result["TYPE"];
			global $tokenDate;
			$tokenDate = $result["TOKEN_DATE"]; // it's a string
			
			if ($userType == 'L') $tokenDate = '2100/01/01'; // lifetime users
			if ($userType == 'A') $tokenDate = '2050/01/01'; // admins
			//if ($tokenDate > date("Y/m/d", strtotime("-15 months")) || $userType == 'L' || $userType == 'A') { // Lifetime or Admins
			if ($tokenDate > date("Y/m/d", strtotime("-15 months")) ) {
			   $_SESSION['token'] = 'valid'; 
			   return true;	
			}
		} 
		return false;	
	} else {
		return true;
	}
}


// Returns true if route is updated, false if inserted
function saveRoute($conn) {
	
	$name = $_REQUEST['name'];
	$url  = $_REQUEST['url'];

	$stmt = $conn->prepare("UPDATE ROUTES SET URL = :url , CREATION_DATE = NOW() WHERE NAME = :name AND USER_ID = (SELECT USER_ID FROM USERS WHERE TOKEN = :token )");
	$stmt->bindParam(':token', $_COOKIE['_mappite_token']);
	$stmt->bindParam(':name', $name); 
	$stmt->bindParam(':url', $url);
	$stmt->execute();
	
	if ($stmt->rowCount() == 0){
		$stmt = $conn->prepare("INSERT INTO ROUTES (USER_ID, NAME, URL, CREATION_DATE) VALUES ((SELECT USER_ID FROM USERS WHERE TOKEN = :token ), :name, :url, NOW())");
		$stmt->bindParam(':token', $_COOKIE['_mappite_token']);
		$stmt->bindParam(':name', $name); 
		$stmt->bindParam(':url', $url);
		$stmt->execute();
		$last_id = $conn->lastInsertId();
		return false;
	} else {
		return true;
	}
}

// Returns true if route is deleted, false if not deleted (not existent)
function deleteRoute($conn) {

	$stmt = $conn->prepare("DELETE FROM ROUTES WHERE NAME = :name AND USER_ID = (SELECT USER_ID FROM USERS WHERE TOKEN = :token )");
	$stmt->bindParam(':token', $_COOKIE['_mappite_token']);
	$stmt->bindParam(':name',  $_REQUEST['name']); 
	$stmt->execute();
	
	if ($stmt->rowCount() == 1) { return true; } else { return false; }
}

function getRoutes($conn) {
	//select route_Name, Url from ROUTES
	//where user_id= (select id from USERS where token = ?)
	//order by 1

	$stmt = $conn->prepare("SELECT NAME 'name', URL 'url' FROM  ROUTES WHERE USER_ID = (SELECT USER_ID FROM  USERS WHERE TOKEN = :token ) ORDER BY 1");
	$stmt->bindParam(':token', $_COOKIE['_mappite_token']);
	$stmt->execute();
	//$result = $stmt->fetchColumn();
	
	$rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ;

	$json = ' "routes": ' .json_encode($rows). '';
	
	return $json;
}

	
?>
