<?php

/**
 * Mappite: experimental Tracker management via Arduino etc


CREATE TABLE TRACKS (
     TRACK_ID  INT UNSIGNED NOT NULL AUTO_INCREMENT,
     USER_ID  INT UNSIGNED NOT NULL,
     NAME VARCHAR(255) NOT NULL,
     GPX MEDIUMTEXT,-- 2^24 = 16MB max
     LON_MIN DECIMAL(3,4),
     LAT_MIN DECIMAL(2,4),
     LON_MAX DECIMAL(3,4),
     LAT_MAX DECIMAL(2,4),
     PUBLIC_FLAG CHAR(1),
     CREATION_DATE DATETIME,
     PRIMARY KEY (TRACK_ID),
     INDEX (USER_ID, NAME)
);

?token=xxx&lat=xxx&lon=xxx&time=xxx&ele=xxx

?k=imei&ll=lat,lon,ele,time|/\lat1,/\lon1,/\ele1,/\t1|...|/\latN,/\lonN,/\eleN,timeN
where time is YYMMDDHHMISS (5 bytes shoudl be enough...)
lat,lon are *1000000
?t=imei

?k=imei&ll=46366188,12909309,10,190115101010|1,2,3,15|-1,-2,-3,-15|10,20,30,100

CREATE TABLE TRACKERS (
     TRACKER_ID  INT UNSIGNED NOT NULL AUTO_INCREMENT,
     USER_ID  INT UNSIGNED NOT NULL,
     TRACKER_CODE  VARCHAR(16) NOT NULL UNIQUE, -- coudl be IMEI hashed
     NAME VARCHAR(255) NOT NULL,
     PUBLIC_FLAG CHAR(1),
     PUBLIC_STARTDATE TIMESTAMP,
     PUBLIC_ENDDATE TIMESTAMP,
     CREATION_DATE DATETIME,
     PRIMARY KEY (TRACKER_ID),
     INDEX (TRACKER_CODE)
);

CREATE TABLE TRACKER_POINTS (
     TRACKER_ID INT UNSIGNED NOT NULL,
     TIMESTAMP  TIMESTAMP NOT NULL,
     ELE	INT,
     SPEED 	INT,
     LON 	INT NOT NULL,
     LAT 	INT NOT NULL,
     INDEX (TRACKER_ID, TIMESTAMP)
);

if (k && valid tracker_code) {
	// assume line in TRACKERS table exists for now

	get tracker_id and CREATION_DATE form TRACKER
	loop on ll
		insert into TRACKER_POINTS 
	if (CREATION_DATE<1month) {
	 delete from TRACKER_POINTS where TIMESTAMP < 1month
	 update TRACKERS set CREATION_DATE = now()
	}
} else if (a="tracker" && validate_session_token) {
	get tracker_id
	select  DATE_FORMAT(TIMESTAMP, "%Y-%m-%dT%H:%i:%sZ"), ELE, LON, LAT from TRACKER_POINTS, USERS where token ans tracke_id order by TIMESTAMP
	loop result and build json 
<<
{ "tracker": {
	"name": "trackName",
	"created_date": "2018-11-13T12:55:25Z",
	"points": [
		[ 45.1234,9.0912,10,"2018-11-13T12:55:25Z" ],
		[ 45.2345,9.0922,20,"2018-11-13T12:56:35Z" ],
		[ 45.3456,9.0926,30,"2018-11-13T12:57:45Z" ],
		[ 45.3456,9.0932,32,"2018-11-13T12:58:56Z" ]
	]
  }
}
<<EOF
	return json	
} // future
 else if (a="download" && validate_session_token) {
	get tracker_id
	select GPX from TRACKS, USERS where token ans tracke_id 
	return GPX as text/xml
} else if (a="upload" && validate_session_token) {
	gpx = $POST[GPX]
	name = $POST[name]
	insert GPX in TRACKS
}


foreach($connection->query('SELECT * FROM users') as $row) {
    echo $row['id'] . ' ' . $row['name'];
}

https://www.sitepoint.com/re-introducing-pdo-the-right-way-to-access-databases-in-php/

{"status": "ok"} means session is valid
 http://mappite.org/alpha/track.php?k=imei&ll=45366319,11909437,30,190115212532|3,-12,-3,11|9,5,0,11|-2,9,0,11

 */
 
header("Content-Type:application/json; charset=utf-8");

$conn = null;
include("db.php"); 

$trackerId = -1;
$trackerName = "Test";
$trackerDate = null;

try {
	if (isset($_REQUEST['k'])) { // log tracker point
		db_connect();
		validateTracker($_REQUEST['k']);
		if ($trackerId > 0 ) { // valid tracker

			$ll = $_REQUEST['ll'];
			
			$arr_ll = explode("|",$ll);
			$lat = $lon = $ele = $time = 0;
			$firstPoint = true;
			foreach($arr_ll as $i){
				$arr_point = explode(",",$i);
				$lat  = $lat + $arr_point[0]; 
				$lon  = $lon + $arr_point[1]; 
				$ele  = $ele + $arr_point[2]; 
				
				if ($firstPoint) { // time is YYMMDDHHMISS in the first occurrence
					$time = date_timestamp_get(date_create_from_format('ymdHis', $arr_point[3]));  //php function to get unix epoch time from date 
					$firstPoint = false;
				} else {
					$time = $time + $arr_point[3]; 			
				}
				db_updateTracker($lon, $lat, $ele, $time);
				/*if ($trackerDate < (new DateTime()-1month) ) {
					// delete from TRACKER_POINTS where TIMESTAMP < 1month
					//update TRACKERS set CREATION_DATE = now()
				} */
			}
			echo '{"status": "ok"}';
		} else {
			echo '{"status": "tracker not found or not available"}';
		}
	} else if (isset($_REQUEST['t'])) { 
		db_connect();
		validateTrackerCode($_REQUEST['t']);
		if ($trackerId > 0) { // if tracker is public || available in this given period || it is my tracker
			$json = db_getTrackerLogs();
			echo $json;
		} else {
			echo '{"status": "tracker not found or not available"}';
		}
	
	}
} catch(PDOException $e) {
	echo '{"status": "Exception", "exception": "' . $e->getMessage() . '"}';
}

$conn  = null;


function db_updateTracker($lon, $lat, $ele, $time) {
	global $conn;
	global $trackerId;
	$stmt = $conn->prepare('INSERT INTO TRACKER_POINTS (TRACKER_ID, LON, LAT, ELE, TIMESTAMP) VALUES (:trackerId, :lon, :lat, :ele, FROM_UNIXTIME(:time))');
	$stmt->bindParam(':trackerId', $trackerId); 
	$stmt->bindParam(':lon' , $lon);
	$stmt->bindParam(':lat' , $lat); 
	$stmt->bindParam(':ele' , $ele);
	$stmt->bindParam(':time', $time);
	$stmt->execute();
}

function db_getTrackerLogs() {
//select  DATE_FORMAT(TIMESTAMP, "%Y-%m-%dT%H:%i:%sZ") 'TIME', ELE 'ELE', LON 'LON', LAT 'LAT' from TRACKERS, TRACKER_POINTS, USERS where token ans tracke_id order by TIMESTAMP
	//$stmt = $conn->prepare("SELECT NAME 'name', URL 'url' FROM  ROUTES WHERE USER_ID = (SELECT USER_ID FROM  USERS WHERE TOKEN = :token ) ORDER BY 1");
	global $conn;
	global $trackerId;
	global $trackerName;
	global $trackerLogo;
	global $trackerDate;
	$sql = "SELECT  DATE_FORMAT(TIMESTAMP, '%Y-%m-%dT%H:%i:%sZ') 'TIME', ELE 'ELE', LON 'LON', LAT 'LAT' FROM TRACKER_POINTS  WHERE TRACKER_ID = :trackerId ORDER BY TIMESTAMP DESC";
	if (isset($_REQUEST['l'])) {
		$sql = $sql . ' LIMIT :limit';
	}
	$stmt = $conn->prepare($sql);
	$stmt->bindParam(':trackerId', $trackerId); 
	if (isset($_REQUEST['l'])) { 
		$stmt->bindParam(':limit', intval( $_REQUEST['l']), PDO::PARAM_INT); 
	}
	$stmt->execute();
	
	$rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ;

	$json = '{ "status": "ok", "tracker": {"name": "'.$trackerName.'","logo": "'.$trackerLogo.'","created_date": "'.$trackerDate.'", "points": [';
	
	foreach ($rows as $row) {
		$json = $json . '[ '.$row['LAT'].','.$row['LON'].','.$row['ELE'].',"'.$row['TIME'].'" ] ,';
	}
	
	$json = substr($json, 0, -1) . '] } }'; // remove last comma
	return $json;
}

// data output
function validateTrackerCode($trackerCode) {
	global $trackerId;
	global $trackerName;
	global $trackerLogo;
	global $trackerDate;
	$trackerId = -1; // -1 if invalid
	global $conn;
	$sql = "SELECT  TRACKER_ID, NAME, LOGO FROM TRACKERS  WHERE TRACKER_CODE = :trackerCode AND PUBLIC_FLAG = 'Y' AND  PUBLIC_STARTDATE < NOW() AND PUBLIC_ENDDATE > NOW() ";
	$stmt = $conn->prepare($sql);
	$stmt->bindParam(':trackerCode', $trackerCode); 	
	$stmt->execute();
	
	$result = $stmt->fetch(PDO::FETCH_ASSOC);
	$trackerId = $result["TRACKER_ID"];
	$trackerName =  $result["NAME"];
	$trackerLogo =  $result["LOGO"];
	
	//$trackerId = $stmt->fetchColumn(0);
	//$trackerName = "boom"; //$stmt->fetchColumn(1);
	//$trackerLogo = $stmt->fetchColumn(2);
	
	$stmt->closeCursor();
	
	$trackerDate= date('Y-m-d H:i:s');
}

// data input
function validateTracker($k) {

	global $trackerId;
	$trackerId = 1; // -1 if invalid
	global $trackerName;
	$trackerName = 'Track Name'; // -1 if invalid
	global $trackerDate;
	$trackerDate= new DateTime();
}

function validateToken() {
	if ($_SESSION['token'] != 'valid') { // we need to start session  this is always != for now !!!!!!!!!!!!!!!!!!!!!!!! performance improvement
		$token = $_COOKIE['_mappite_token'];
		$stmt = $conn->prepare("SELECT USER_ID FROM USERS WHERE TOKEN = :token");
		$stmt->bindParam(':token', $token);
		$stmt->execute();
		$result = $stmt->fetchColumn();
		$stmt->closeCursor();
		if ($result == false) { 
			return false; 
		} else { 
			$_SESSION['token'] = 'valid'; 
			return true; 
		}
	} else {
		return true;
	}
}


//$email = $_REQUEST['email'];
//$key = hash('md5', ($email .base64_encode(random_bytes(10))));
	
?>
