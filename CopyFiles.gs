var lastcommit = PropertiesService.getScriptProperties();
var username = '';//insert your gitHub username
var reponame = '';//insert the name of the repo you want to copy over
var api_root = 'https://api.github.com/repos/'+username+'/'+reponame+'/';
var copyrepo = '';//insert the name of the folder you want the files copied to
var excludes = [] //add the names of md files that you don't want to download, for example README.md


var update_list = [];
function onOpen() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  const columns = [['Markdown IDs', 'Markdown Links', 'Quiz IDs', 'Quiz Links', 'Spreadsheet IDs', 'Spreasheet Links']]
  sheet.getSheetByName("Repo").getRange("A1:F1").setValues(columns)
  var entries = [{
    name : "Create the Copy Repo",
    functionName : "createRepo"
  },{
    name : "Update",
    functionName : "updateIDs"
  },{
    name : "Create Quizzes in Range",
    functionName : "readIDsInRange"
  }];
  sheet.addMenu("Script Menu", entries);
}


function createRepo(){
  createMarkdownFolderFile();
  sendIds();
}

function updateIDs(){
  check_for_updates();
  sendIds();
}

function createMarkdownFolderFile() {  
  checkAccess();
  
  // Create folder
  var root = DriveApp.createFolder(copyrepo);
  var name = '';
  create(root,name);
  
  var lastCom = getCommits()[0];
  lastcommit.setProperty('sha_commit', lastCom);
}


function create(fldr, foldername){
  //Logger.log("in create method");
  var elements = getItems(foldername);
  var shas = getShas(foldername);
  var names = getFileNames(foldername);
  
  for (var i in elements){
    if (elements[i]=="file"){
      if (names[i].endsWith('.jpg')||names[i].endsWith('.jpeg')){
        var content = getContents(shas[i],"image");
         fldr.createFile(content);
        Logger.log("should not be here")
      }
      else{
        var content = getContents(shas[i], "text");
        var file = fldr.createFile(names[i], content, MimeType.PLAIN_TEXT);
        update_list.push(file.getId())
      }
    }
    else if (elements[i]=="dir"){
      create(fldr, foldername+"/"+names[i]);
    }
  }
}


function sendIds(){
  var root = DriveApp.getFoldersByName(copyrepo);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Repo");
  var temp1;
  if (root.hasNext()){
    temp1= root.next();
  }
  if(!temp1){
    SpreadsheetApp.getUi().alert("repo not created in drive");
  }
  var arr = temp1.getFiles();
  var temp;
  var ids = sheet.getRange("A2:A").getValues().map(id =>id.toString());
  var i = ids.filter(String).length+2;
  var updated_names = []
  while (arr.hasNext()){
    temp = arr.next();
    var name = temp.getName()
    var id = temp.getId();
    if (name.endsWith(".md") && excludes.indexOf(name)==-1){
      if(update_list.includes(id) && ids.includes(id)){
        updated_names.push(name);
        createQuizById(id, '', ids.indexOf(id)+2);
      }
      else if(!ids.includes(id)){
        sheet.getRange('A'+i).setValue(id);
        sheet.getRange('B'+i).setFormula('=HYPERLINK("'+temp.getUrl()+'","'+name+'")');
        if(update_list.includes(id)){
          updated_names.push(name);
          createQuizById(id, '', i);
        }
        i++;
      }
    }
  }
  SpreadsheetApp.getUi().alert("updated "+updated_names.length+" file"+(updated_names.length>=2?"s":"")+": "+updated_names.toString());
  update_list = []
  updated_names = []
}
/*
function sendIds(){
  SpreadsheetApp.getUi().alert("update list = "+update_list.toString());
  var root = DriveApp.getFoldersByName(copyrepo);
  var sheet = SpreadsheetApp.getActiveSheet();
  var temp1;
  if (root.hasNext()){
    temp1= root.next();
  }
  var arr = temp1.getFiles();
  var temp;
  var prevVals = {}
  for(var i=2;i<=sheet.getDataRange().getLastColumn();i++){
    if(sheet.getRange('C'+i).getValue()!=""){
        prevVals[sheet.getRange('A'+i).getValue()] = [sheet.getRange('B'+i).getFormula(), 
                                                     sheet.getRange('C'+i).getValue(), 
                                                     sheet.getRange('D'+i).getFormula(), 
                                                     sheet.getRange('E'+i).getValue(),
                                                     sheet.getRange('F'+i).getFormula() ]
      }
  }
  SpreadsheetApp.getUi().alert("range = "+2+" to "+sheet.getDataRange().getLastColumn()+" prevVals: "+JSON.stringify(prevVals));
  var i =2;
  var updated_names = []
  while (arr.hasNext()){
    temp = arr.next();
    tempName = temp.getName()
    if (tempName.endsWith(".md") && excludes.indexOf(tempName)==-1){
      if(update_list.includes(temp.getId())){
        sheet.getRange('A'+i+":F"+i).clear();
        sheet.getRange('A'+i).setValue(temp.getId());
        sheet.getRange('B'+i).setFormula('=HYPERLINK("'+temp.getUrl()+'","'+temp.getName()+'")');
        updated_names.push(temp.getName());
        createQuizById(temp.getId(), '', i);
      }
      else if(temp.getId() in prevVals){
        var list = prevVals[temp.getId()]
        sheet.getRange('A'+i).setValue(temp.getId())
        sheet.getRange('B'+i).setFormula(list[0])
        sheet.getRange('C'+i).setValue(list[1])
        sheet.getRange('D'+i).setFormula(list[2])
        sheet.getRange('E'+i).setValue(list[3])
        sheet.getRange('F'+i).setFormula(list[4])
        //delete prevVals[temp.getId()]
      }
      else{
        sheet.getRange('A'+i+":F"+i).clear();
        sheet.getRange('A'+i).setValue(temp.getId());
        sheet.getRange('B'+i).setFormula('=HYPERLINK("'+temp.getUrl()+'","'+temp.getName()+'")');
       }
      i++;
    }
  }
  /*  put back on spreadsheet files that are no longer in repo
  for(id in prevVals){
    var list = prevVals[id]
    sheet.getRange('A'+i).setValue(id)
    sheet.getRange('B'+i).setFormula(list[0])
    sheet.getRange('C'+i).setValue(list[1])
    sheet.getRange('D'+i).setFormula(list[2])
    sheet.getRange('E'+i).setValue(list[3])
    sheet.getRange('F'+i).setFormula(list[4])
    i++
  }
  SpreadsheetApp.getUi().alert("updated:"+updated_names.toString());
  prevVals = []
  update_list = []
}*/

function check_for_updates(){
  var commits = getCommits();
  
  var temp = lastcommit.getProperty('sha_commit');

  var i =0;
  var arr = [];
  
  while (temp!= commits[i]){//reverse the commits
    //update(commits[i]);
    arr.push(commits[i]);
    i++;
  }
  //Logger.log(arr.length);
  for (var k = arr.length-1; k>=0; k--){
    update(arr[k]);
    Logger.log(arr[k]);
  }
  
  lastcommit.setProperty('sha_commit', commits[0]);
}

function update(sha){
  var api = api_root+'commits/'+sha;
  var response = myRequest (api);
  var json = JSON.parse(response.getContentText());
  
  var arrfiles = [];   
  //var updatedIDs = [];
  
  for (var i =0; i<(json.files).length; i++){
    
    arrfiles.push((json.files)[i].sha);
    var name = (json.files)[i].filename;
    //Logger.log(ext);
    var fldr = DriveApp.getFoldersByName(copyrepo).next();
    
    if ((json.files)[i].status == 'added'){
      var fileID = '';
      //var name = getFileName(ext);
      if (name.endsWith('.jpg')||name.endsWith('.jpeg')){
        var content = getContents(arrfiles[i],"image");
        var f = fldr.createFile(content);
        fileID=f.getId();
        update_list.push(fileID);
        //updatedIDs.push (fileID);
      }
      else{
        var content = getContents(arrfiles[i], "text");
        var f = fldr.createFile(name, content, MimeType.PLAIN_TEXT);
        fileID=f.getId();
        update_list.push (fileID);
        //testById(fileID);
      }
      
    }
    
    else if ((json.files)[i].status == 'modified'){
      var fileID = '';
      //var name = getFileName(ext);
      var file = DriveApp.getFilesByName(name).next();
      var content = getContents(arrfiles[i], "text");
      file.setContent(content);
      fileID=file.getId();
      update_list.push (fileID);
      //testById(fileID);
    }
    
    else if ((json.files)[i].status == 'removed'){
      //var name = getFileName(ext);
      Logger.log (name);
      var file = DriveApp.getFilesByName(name).next();
      file.setTrashed(true);
      fileID=file.getId();
      update_list.push (fileID);
    }
  }
  
}

function getCommits(){
  var api = api_root+'commits';
  var response = myRequest (api);
  var json = JSON.parse(response.getContentText());
  
  var commits = [];
  if (json.length==1){
    commits.push(json[0].sha);
    Logger.log(commits);
  } 
  else{
    json.forEach(function(elem) {
      if (elem["sha"] != null){
        commits.push(elem["sha"]);
      }
    });
  }
  
  return commits;
}

function getItems(extension){
  if (extension == '')
    var api = api_root+"contents/";
  else
    var api = api_root+"contents/"+extension;
  
  var response = myRequest (api);
  var json = JSON.parse(response.getContentText());
  
  var type = [];
  
  //Logger.log(json.length);
  if (json.length==1){
    type.push(json[0].type);
  }
  else{
    json.forEach(function(elem) {
      if (elem["type"] != null){
        type.push(elem["type"]);
      }
    });
  }
  return type;
}

function getFileNames(extension){
  if (extension == '')
    var api = api_root+"contents/";
  else
    var api = api_root+"contents/"+extension;
  
  var response = myRequest (api);
  var json = JSON.parse(response.getContentText());
  
  var names = [];
  
  if (json.length==1){
    names.push(json[0].name);
  }
  else{
    json.forEach(function(elem) {
      if (elem["name"] != null){
        names.push(elem["name"]);
      }
    });
  }
  return names;
}

function getFileName(sha){
  var api = api_root+"contents/"+sha;
  
  var response = myRequest (api);
  var json = JSON.parse(response.getContentText());
  return json.name;
}

function getShas (extension){
  if (extension == '')
    var api = api_root+"contents/";
  else
    var api = api_root+"contents/"+extension;
  
  var response = myRequest (api);
  var json = JSON.parse(response.getContentText());
  
  var sha = [];
  if (json.length==1){
    sha.push (json[0].sha);
  }
  else{
    json.forEach(function(elem) {
      if (elem["sha"] != null){
        sha.push(elem["sha"]);
      }
    });
  }
  return sha;
}

function getContents (sha, type){
  var api2 = api_root+"git/blobs/"+sha;
  var response2 = myRequest (api2);
  var json2 = JSON.parse(response2.getContentText());
  
  //Logger.log(api2);
  if (type == "text"){
    var cont = json2.content;
    cont = Utilities.base64Decode(cont);
    var r = Utilities.newBlob(cont).getDataAsString();
    return r;
  }
  
  var cont = json2.content;
  var decoded = Utilities.base64Decode(cont, Utilities.Charset.UTF_8);
  var blob = Utilities.newBlob(decoded, "image/jpeg", 'img_'+sha+'.jpg'); 
  //DriveApp.createFile(blob);
  return blob;
  //Logger.log(Utilities.newBlob(cont).getDataAsString());
  
  
  
}

function myRequest (url){
  var headers = {
       "Authorization": "Bearer " + getGithubService_().getAccessToken(),
       "Accept": "application/vnd.github.v4+json"
     };
     
     var options = {
       "headers": headers,
       "method" : "GET",
       "muteHttpExceptions": true
     };
  return UrlFetchApp.fetch(url, options);
}

function checkAccess (){
  var service = getGithubService_();
  if (service.hasAccess()) {
    Logger.log("App has access.");
    return true;
  }
  else {
     Logger.log("App has no access yet.");
     
     // open this url to gain authorization from github
     var authorizationUrl = service.getAuthorizationUrl();
     Logger.log("Open the following URL and re-run the script: %s",
         authorizationUrl);
    return false;
   }
}
//https://www.benlcollins.com/apps-script/oauth-github/
//https://mashe.hawksey.info/2016/08/working-with-github-repository-files-using-google-apps-script-examples-in-getting-writing-and-committing-content/

