JSON.myParse = function(str){
  try{
    return this.parse(str)
  }catch(e){
    throw MyParseException(e.message + "\n" + str)
  }

}