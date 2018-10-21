function sendLineNotify(accessToken, message){
  if(accessToken == ""){throw "LineTokenが空白です"}
  var url = "https://notify-api.line.me/api/notify"
  var payload = "message="  + message
  var params = {
      "method": "POST",
      "headers": {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": 	"Bearer " + accessToken
      },
      "payload": payload
  }
  UrlFetchApp.fetch(url, params)
}