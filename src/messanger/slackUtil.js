function sendSlackNotify(slackUrl, message){
  if(slackUrl == ""){throw "slackURLが空白です"}
  var params = {"text": message}
  var option = {
      "payload": JSON.stringify(params),
      "method": "POST",
      "header": {
          "Content-type": "application/json"
      }
  }
  return UrlFetchApp.fetch(slackUrl, option)
}
  