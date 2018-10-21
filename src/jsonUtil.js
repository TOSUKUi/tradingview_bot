JSON.myParse = function(str){
  try{
    return this.parse(str)
  }catch(e){
    throw e.message + "\n" + str
  }

}