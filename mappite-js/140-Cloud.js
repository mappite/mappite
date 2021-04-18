/*** Cloud functions ***/

/*
 * Reset Password
 */
function  resetPassword() {
	
	consoleLog("resetPassword()" );
	var email = $('#sEmail').val();
	
	// FIXME check email
	
	if (email.length <6) {
		alert("Email?");
	} else {
		var jurl="./cloud.php?action=resetPwd&email="+email; 
		// not using getJSON to set a timeout
		$.ajax({
		  dataType: "json",
		  url: jurl,
		  timeout: 1500,
		  success: function( json ) {
			// { "result": "ok" }
			consoleLog("resetPassword() - json.status:" + json.status);
			if (json.status === "ok" ) { // password changed
				alert(translations["cloud.rstPwdDone"] );
			} 
		  },
		  error: function(jqXHR, textStatus, errorThrown) {
			consoleLog( "resetPassword Failure: " + textStatus + " - " + errorThrown);
		  }
		});
	}
}
/*
 * Enroll or Unenroll
 */
function  cloudEnroll() {
	
	if (getCookie("enrolled") === "yes") { // unenroll
		
		consoleLog("cloudEnroll() - unenroll" );
		if (window.confirm(translations["cloud.unenrollConfirm"])) {
			if (window.confirm(translations["cloud.unenrollClearRoutes"]) )  { window.localStorage.clear(); }
			setCookie("enrolled","no",-1); // expire cookie
			// inform server 
			var jurl="./cloud.php?action=unenroll"; 
			consoleLog("cloudEnroll() - jurl:" + jurl);
			// not using getJSON to set a timeout
			$.ajax({
			  dataType: "json",
			  url: jurl,
			  timeout: 1500,
			  success: function( json ) {
				// { "result": "ok" }
				consoleLog("cloudEnroll() - json.status:" + json.status);
				if (json.status === "ok" ) { // unenroll successfull
					// set html in div
					document.getElementById("gEnroll").innerHTML=  translations["cloud.unenrolled"];
					$("JgEnrollButton").remove();
					//consoleLog("cloudEnroll() - setting enrolled cookie to no");
					//setCookie("enrolled","no",1); // expires tomorrow (+1 day)			
					refreshSavedRoutes();
				} 			  
			  },
			  error: function(jqXHR, textStatus, errorThrown) {
				consoleLog( "cloudEnroll Failure: " + textStatus + " - " + errorThrown);
			  }
			});
		}
	} else { // enroll
		var email = $('#sEmail').val(); // backend will lowercase this
		var pwd = $('#sPwd').val(); // backend will lowercase this
		var jurl="./cloud.php?action=enroll&email="+email+"&pwd="+pwd; 
		consoleLog("cloudEnroll() - jurl:" + jurl);
		// not using getJSON to set a timeout
		$.ajax({
		  dataType: "json",
		  url: jurl,
		  timeout: 1500,
		  success: function( json ) {
			consoleLog("cloudEnroll() - json.status:" + json.status);
			if (json.status === "ok" ) { // enroll successfull
				setCookie("enrolled","yes",1825); // 5 yrs
				consoleLog("cloudEnroll() - OK! refreshing routes");
				var elem = document.getElementById("gHeaderEnroll"); // this element disappears when one clicks on info icon
				if (elem != null) elem.innerHTML=  translations["cloud.enrolled"];
				document.getElementById("JgEnrollButton").innerHTML=  translations["cloud.unenroll"];
				refreshSavedRoutes();
			} else if (json.tokenDate == "false") {
				alert(translations["cloud.invalidEnroll"] );
				consoleLog(json);
			} else {  // a tokenDate exists, this is an expired token
				alert(translations["cloud.enrollExpired"]); 
				var elem = document.getElementById("gHeaderEnroll"); // this element disappears when one clicks on info icon
				if (elem != null) elem.innerHTML= translations["cloud.enrollExpired"];
				document.getElementById("gEnroll").innerHTML=  translations["cloud.enrollExpired"];
			}
			
		  },
		  error: function(jqXHR, textStatus, errorThrown) {
			consoleLog( "cloudEnroll Failure: " + textStatus + " - " + errorThrown);
		  }
		});
	}
}

/*
 * Refresh Cloud Routes
 * invoked from SaveLoad.js if getCookie("enrolled") === "yes"
 */
function refreshCloudRoutes() {
	var jurl="./cloud.php?action=getRoutes"; 
	// not using getJSON to set a timeout
	$.ajax({
	  dataType: "json",
	  url: jurl,
	  timeout: 2500,
	  success: function( json ) {
		if (json.status === "ok" ) { // valid
			
			var routes = json.routes;
			for (i=0;i<routes.length; i++){ // add to local storage
				consoleLog("Cloud Route found: " + routes[i].name); 
				localStorage.setItem("gRoute|"+routes[i].name , "C_"+routes[i].url); // "C_ means from cloud
			}
			
			
			var jsTokenDate = new Date(Date.parse(json.tokenDate));
			consoleLog("Token Date: " + jsTokenDate);
		
			if (jsTokenDate.setFullYear(jsTokenDate.getFullYear() + 1)<(new Date()) ) { // token expired GRACE PERIOD, show warning
				consoleLog("Token in Grace Period");
				// set text in top banner and cloud menu
				var elem = document.getElementById("gHeaderEnroll"); // this element disappears when one clicks on info icon
				if (elem != null) elem.innerHTML= translations["cloud.enrollGrace"];
				document.getElementById("gEnroll").innerHTML=  translations["cloud.enrollGrace"];
				enrollFile = enrollExpiredFile;
			}
			
		} else if (json.tokenDate == "false") {
			consoleLog("Token Invalid");

			alert(translations["cloud.invalid"] );

		} else { // a tokenDate exists, this is an expired token
			var jsTokenDate = new Date(Date.parse(json.tokenDate));
			consoleLog("Token Expired: " + jsTokenDate);
			alert(translations["cloud.enrollExpired"]); 
			// set text in top banner and cloud menu
			var elem = document.getElementById("gHeaderEnroll"); // this element disappears when one clicks on info icon
			if (elem != null) elem.innerHTML= translations["cloud.enrollExpired"];
			document.getElementById("gEnroll").innerHTML=  translations["cloud.enrollExpired"];
			enrollFile = enrollExpiredFile;
		}
		
		refreshSavedRoutesHtml(); // display in any case all route in local storage
		  
	  },
	  error: function(jqXHR, textStatus, errorThrown) {
		consoleLog( "cloud get Routes Failure: " + textStatus + " - " + errorThrown);
		refreshSavedRoutesHtml();
	  }
	});
}

function  saveRouteCloud(name, url) {
	$("#gCloudIcon").attr("src", "./icons/spinner.svg"); // start spin
	//var token = getCookie("token");
	var jurl="./cloud.php?action=saveRoute&name="+name+"&url="+encodeURIComponent(url);
	consoleLog("saveRouteCloud() - jurl:" + jurl);
	// not using getJSON to set a timeout
	$.ajax({
	  dataType: "json",
	  url: jurl,
	  timeout: 1500,
	  success: function( json ) {
		consoleLog("saveRouteCloud()");
		if (json.status === "ok"  ) { // token correct
			consoleLog("Cloud Route Save, result: " +json.result ); // inserted or updated 
		} else {
			alert(translations["cloud.invalid"] );
			consoleLog(json);
		}
		$("#gCloudIcon").attr("src", "./scripts/images/cloud.svg"); // stop spin

	  },
	  error: function(jqXHR, textStatus, errorThrown) {
		consoleLog( "saveRouteCloud Failure: " + textStatus + " - " + errorThrown);
		alert("SaveRouteCloud Failure: " + textStatus + " - " + errorThrown);
	  }
	});	
}

function  deleteRouteCloud(name) {
	$("#gCloudIcon").attr("src", "./icons/spinner.svg"); // start spin
	//var token = getCookie("token");
	var jurl="./cloud.php?action=deleteRoute&name="+name;
	consoleLog("deleteRouteCloud() - name:" + name);
	// not using getJSON to set a timeout
	$.ajax({
	  dataType: "json",
	  url: jurl,
	  timeout: 1500,
	  success: function( json ) {
		if (json.status === "ok" ) { // token correct
			consoleLog("Cloud Route Delete Attempt, result: " +json.result ); // 
			$("#gCloudIcon").attr("src", "./scripts/images/cloud.svg"); // stop spin
		} else {
			alert(translations["cloud.invalid"] );
			consoleLog(json);
		}

	  },
	  error: function(jqXHR, textStatus, errorThrown) {
		consoleLog( "cloudEnroll Failure: " + textStatus + " - " + errorThrown);
	  }
	});	
}