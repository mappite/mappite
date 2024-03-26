<html><title>Mappite - Reset Password</title>
<head>
	<meta charset="utf-8" />
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
	<img src="./mappiteLabel.png" width="250px"> <br><br>
<?php
header("Content-Type:text/html; charset=utf-8");

$conn = null;
include("db.php");

try {
	if (isset($_GET['tmpPwd'])) { // basic check on argument
		?>
		<form method="POST" action="./up.php">
		<table>
		<tr><td>New Password / Nuova Password / Nouveau mot de passe / Neues Kennwort / Nueva contrasena</td>
		<td> <input name="newPwd1" type="password" required pattern=".{6,}" onchange="form.newPwd2.pattern = RegExp.escape(this.value);"></td></tr>
		<tr><td>Retype Password / Riscrivi Password / Retaper le mot de passe / Passwort erneut eingeben / Vuelva a escribir la contrasena</td>
		<td> <input name="newPwd2" type="password" required></td></tr>
		</table>
		<input name="tmpPwd" type="hidden" value="<?php echo $_GET['tmpPwd'] ?>" >
		<input type="submit" value=">>">
		</form>
		<script type="text/javascript">

		  // polyfill for RegExp.escape
		  if(!RegExp.escape) {
		    RegExp.escape = function(s) {
		      return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
		    };
		  }

		</script>
		<?
	} else if ( isset($_POST['tmpPwd']) && isset($_POST['newPwd1']) ) {
		
		db_connect();
		if (updatePassword($_POST['newPwd1'], $_POST['tmpPwd'])) {
		 ?><p> OK :) <a href="https://mappite.org">Mappite</a> </p><?			
		} else {
		 ?><p> :( </p><?
		}

	} 

} catch(PDOException $e) {
	echo '{"status": "Exception", "exception": "' . $e->getMessage() . '"}';
}

$conn  = null;

function updatePassword($newPwd, $tmpPwd) { // and update new token as well
	global $conn;
	$newPwd = trim($newPwd);
	$stmt = $conn->prepare("UPDATE USERS SET PWD = MD5(:newPwd), TOKEN = :token WHERE TMPPWD = :tmpPwd AND TMPPWD_DATE > DATE_SUB(NOW(), INTERVAL 12 HOUR)") ; // FIXME not smart, risk of a mass update
	$stmt->bindParam(':newPwd', $newPwd );
	$token= bin2hex(random_bytes(10)).uniqid();
	$stmt->bindParam(':token', $token );
	$stmt->bindParam(':tmpPwd', $tmpPwd );
	$stmt->execute();
	if ($stmt->rowCount() == 0){
		return false;
	} else {
		return true;
		setcookie('_mappite_token',$token,time()+86400*365,null,null,false, true); // token has been set in http_only cookie for 1 yrs
	}
	
}


	
?>
</body></html>