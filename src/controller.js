function onOpen(){
  SpreadsheetApp.getUi()
  .createMenu('botControl')
  .addItem('Run bot', 'trigger')
  .addItem('Stop bot', 'delTrigger')
  .addItem('Test order', 'testrun')
  .addToUi()
}

function testrun(){
  validate()
  createTableIfNotExist()
  bot()
}

function trigger(){
  createTableIfNotExist()
  var triggers = ScriptApp.getProjectTriggers();
  var ss = SpreadsheetApp.getActive()
  var sheet = ss.getSheetByName("bot稼働状況")
  var status = sheet.getRange(1,1)
  var statusVal = status.getValue()
  var botTrigger = undefined
  for(var i=0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == "bot") {
      botTrigger = ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  if(statusVal == "稼働中" || botTrigger){
    throw "botはすでに稼働中です。もし停止したい場合はStop Botを選択してください"
  }else{
    ScriptApp.newTrigger("bot").timeBased().everyMinutes(1).create();
    status.setValue("稼働中")
  }
}

function delTrigger(){
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == "bot") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  var ss = SpreadsheetApp.getActive()
  var sheet = ss.getSheetByName("bot稼働状況")
  var status = sheet.getRange(1,1)
  status.setValue("停止中")
}

function onEdit(){
  setValidateTicker()
}

function setValidateTicker(){
  var ss = SpreadsheetApp.getActive()
  var config = ss.getSheetByName("調整項目")
  var pltsheet = ss.getSheetByName("tradingPlatform")
  var platforms = reduceDim(pltsheet.getRange(2, 2, pltsheet.getLastRow()-1 ).getValues())
  var tickers = getTickers()
  var rules_ticker = {}
  for(var i=0; i < platforms.length; i++){
    rules_ticker[platforms[i]] = SpreadsheetApp.newDataValidation().requireValueInList(tickers[platforms[i]]).setAllowInvalid(false)
  }
  var platformConfig = reduceDim(config.getRange(2, 2, config.getLastRow() - 1).getValues())

  var targetCells = config.getRange(2, 9, config.getLastRow() - 1)
  var rulesCell = []
  for(var i=0; i < platformConfig.length; i++){
    rulesCell[i] = [rules_ticker[platformConfig[i]]]
  }
  targetCells.setDataValidations(rulesCell)
}

function reduceDim(array){
  // [[a], [b], [c]] to [a,b,c]
  output = []
  for(var i=0; i < array.length; i++){
    output.push(array[i][0])
  }
  return output
}


function getTickers(){
  var sheet = SpreadsheetApp.getActive().getSheetByName("tickers");
  var plat_tick = sheet.getRange(2, 2, sheet.getLastRow()-1, 2).getValues();
  var tickers = {};
  for(var j=0; j < plat_tick.length; j++){
    if(tickers[plat_tick[j][0]] == undefined) tickers[plat_tick[j][0]] = [];
    tickers[plat_tick[j][0]].push(plat_tick[j][1])
  }
  return tickers
  Logger.log(tickers)
}

function validate(){
  var alerts = validateConfigs().concat(validateMessage())
  if(alerts.length > 0){
    Logger.log(alerts.join(" | "))
    Browser.msgBox(alerts.join("\\n"))
    throw "入力箇所を修正して再度テストしてください"
  }
}

function validateMessage(){
  try{
    chatMessage("テストメッセージ")
  }catch(e){
    return ["メッセージ送信設定が間違っている可能性があります: " + e]
  }
  return []
}


function validateConfigs(){
  var spreadSheet = SpreadsheetApp.getActive()
  var sheet = spreadSheet.getSheetByName("調整項目")
  var dataValues = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues()
  var headers = dataValues[0]
  var dataArray = dataValues.slice(1)
  var alerts_list = []
  symbols = []
  dataArray.forEach(function(datalist){
    var dataBody = datalist.slice(1)
    var dataSymbol = datalist[0]
    if(symbols.indexOf(dataSymbol) >= 0){
      alerts_list.push("戦略シンボル" + dataSymbol + "が重複しています")
    }
    symbols.push(dataSymbol)
    dataObj = {}
    for(var i=0; i<dataBody.length; i++){
      dataObj[headers[i+1]] = dataBody[i]
    }
    alerts_list = alerts_list.concat(validateConfig(dataSymbol, dataObj))
  })
  return alerts_list
  
}

function validateConfig(dataSymbol, config){
  if(dataSymbol == ""){throw "どれかしらの戦略シンボルが入力されていません"}
  Logger.log(config)
  var alerts = []
  Object.keys(config).forEach(function(key){
    if(key == "ストップのポジションとの差"){
      if(config["ストップロスタイプ"] == "無し"){
        return
      }
    }else if(config[key] == ""){
      alerts.push("ストラテジー " + dataSymbol + " における " + key + " が入力されていません")
    }else{
      return
    }
  })
  if(alerts.length == 0){
    var api = new APIInterface()[config["プラットフォーム"]](config["APIkey"], config["APIsecret"])
    try{
      api.getPosition(config["ticker"])
    }catch(e){
      alerts.push("ストラテジー" + dataSymbol + "のAPI認証情報が間違っている可能性があります" + e.message)
    }
  }
  return alerts
}