var quizRepo = '';//insert the name of the folder you want the quizzes to be stored in

function test(){
  var MSumSheet= SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Summary")
   var nextCol = MSumSheet.getDataRange().getLastColumn()
   Logger.log(nextCol)
  }
/*
function readIDs(){
  findFolderID();
  Logger.log("reading ids");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Repo");
  var i =2;
  var id = '';
  var formId = '';
  while (sheet.getRange("A"+i).isBlank()==false){
    id = sheet.getRange('A'+i).getValue();
    formId = sheet.getRange('C'+i).getValue();
    //Logger.log("reading id: "+id);
    createQuizById(id, formId, i);
    i++;
  }
}*/

function readIDsInRange(){
  findFolderID();
  Logger.log("reading ids in range");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Repo");
  var activeRange = sheet.getActiveRange();
  var i =activeRange.getRow();
  var id = '';
  var formId = '';
  while (sheet.getRange("A"+i).isBlank()==false && i <= activeRange.getLastRow()){
    id = sheet.getRange('A'+i).getValue();
    formId = sheet.getRange('C'+i).getValue();
    //Logger.log("reading id: "+id);
    createQuizById(id, formId, i);
    i++;
  }
}

function findFolderID(){
  var root = DriveApp.getFoldersByName(quizRepo);
  var temp1;
  if (root.hasNext()){
    temp1= root.next();
  }
  else{
    temp1 = DriveApp.createFolder(quizRepo)
  }
  var folder = temp1.getId();
  var fI = PropertiesService.getScriptProperties().setProperty("quizFolderId", folder);
}

//run this method with the ID of the source file to create the corresponding quiz and spreadsheet
//if formId is empty, a new form will be created
function createQuizById(fileId,formId, index){
   var file = DriveApp.getFileById(fileId)
   var today = new Date();
   var date = "_"+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
   var quizName = file.getName().replace(/.md$/, date)
   var quizFolder = getQuizFolder()
   var form;
   if(formId){
    form = FormApp.openById(formId)
    Logger.log("overwriting: " + form.getEditUrl());
    clearQuestions(form)
  }
  else{
     form = newQuizInFolder(quizName, quizFolder, index);
     Logger.log( "no quiz with for file "+fileId+" exists, new form created:"+form.getEditUrl());
  }
   dataString = file.getBlob().getDataAsString();
   addQuestions(form, dataString);
}

  

//index can be empty
function newQuizInFolder(quizName, Folder, index){
  var form = FormApp.create(quizName);
  var ss = SpreadsheetApp.create(quizName);
  if(index){
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Repo");
    sheet.getRange("C"+index).setValue(form.getId());
    sheet.getRange("D"+index).setFormula('=HYPERLINK("'+form.getEditUrl()+'","'+quizName+'")');
    sheet.getRange("E"+index).setValue(ss.getId());
    sheet.getRange("F"+index).setFormula('=HYPERLINK("'+ss.getUrl()+'","'+ss.getName()+'")');
  }
  form.setIsQuiz(true).setRequireLogin(true).setCollectEmail(true);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId())
  var file = DriveApp.getFileById(form.getId());
  Folder.addFile(file);
  file = DriveApp.getFileById(ss.getId());
  Folder.addFile(file);
  return form;
}




//get forms with quizName in quizFolder
function getQuizFolder(){
  var sProperties = PropertiesService.getScriptProperties();
  var quizFolderId = sProperties.getProperty("quizFolderId");
  try{
    var quizFolder = DriveApp.getFolderById(quizFolderId)
  }
  catch(err){
    quizFolder = DriveApp.getRootFolder()
  }

  return quizFolder;
}



//delete all questions in form, and make a new spreadsheet
function clearQuestions(form){
    /*
    var sheet = SpreadsheetApp.getActiveSheet();
    var ss = SpreadsheetApp.openById(form.getDestinationId());
    ssname = ss.getName()
    ss.rename("old_"+ssname);
    ss = SpreadsheetApp.create(ssname);
    */
    form.getItems().forEach(function(item){
      form.deleteItem(item);
    });
    /*
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId())
    if(index){
      sheet.getRange("E"+index).setValue(ss.getId());
      sheet.getRange("F"+index).setFormula('=HYPERLINK("'+ss.getUrl()+'","'+ss.getName()+'")');
    }
    file = DriveApp.getFileById(ss.getId());
    Folder.addFile(file);
    */

}

//add questions to form from dataString, and also add columns to the invidvisual and master summary sheet for each question
function addQuestions(form, dataString){
  dataString = dataString.replace(/- +/, "")  //get rid of the first question separator
  var questions = dataString.split(/\n+- +/);
  Logger.log("questions = "+questions);
  questions.forEach( function(question){
     var lines = question.split(/\n\s+- +/g)
     Logger.log("lines = "+lines)
     if(lines.length>0){
       lines = lines.map(function(line, index){
          return processImage(line, form , index)
       });
       var item = form.addCheckboxItem();
       var title = lines.shift()
       item.setTitle(title);
       var choices = lines.map(
          line => addAnswer(item, line, null, 10)
       );
       item.setChoices(choices);
     }
    
  })
  
  addToSummary(form)
}

function processImage(line, form, index){
  const regImage = /!\[.*\]\(.+\)/
  const regImagUrl = /(?<=\()\S+(?= |\))/
  //const regImageCaption = /(!\[)(.*)(\])/g
  var imageBlock = regImage.exec(line)
  if(imageBlock!=null){
     //var caption = regImageCaption.exec(line)[2]
     line = line.replace(regImage, "")
     var img = UrlFetchApp.fetch(regImagUrl.exec(imageBlock))
     var item = form.addImageItem()
     var title = line.replace("*", "").trim()
     if(title==""){
        title = index == 0? "Question " + (item.getIndex()+1) : String.fromCharCode(96 + index)
        line +=title
     }
     item.setImage(img).setTitle(title)
  }
  return line;
}




function addAnswer(item, answer, feedback, points, ){
    choice = isCorrect(answer) ? item.createChoice(answer.slice(1), true): item.createChoice(answer, false)
    if(feedback){
        if(feedback.correct){
            var correctFeedback = FormApp.createFeedback()
                .setText(feedback.correct)
                .build();
            item.setFeedbackForCorrect(correctFeedback);
        }
        if(feedback.incorrect){
            var incorrectFeedback = FormApp.createFeedback()
                .setText(feedback.incorrect)
                .build();
            item.setFeedbackForCorrect(incorrectFeedback);
        }
    }
    if(points){
        item.setPoints(points)
    }
    
    return choice;
}

function test(){
  var MSumSheet= SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Summary")
   MSumSheet.getRange("B:B").setBorder(null, true, null, null, null, null)
}
//add the answers to the master summary sheets
function addToSummary(form){
  var ss = SpreadsheetApp.openById(form.getDestinationId())
  var MSumSheet= SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Summary")
  if(!MSumSheet)
    MSumSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Summary")
  MSumSheet.getRange("A1:A5").setValues([['Question'], ['Answer'], ['Count'], ['%'], ['Emails']])
  var items = form.getItems(FormApp.ItemType.CHECKBOX)     //get all the questions from the column names
  var nextCol = MSumSheet.getDataRange().getLastColumn()
  for (var k = 0; k<items.length; k++){
       item = items[k].asCheckboxItem();
       var question = item.getTitle();
       var startCol = colName(nextCol);
       MSumSheet.getRange(startCol+":"+startCol).setBorder(false, true, false, false, false, false)
       MSumSheet.getRange(startCol+"1").setValue(question);
       MSumSheet.getRange("4:4").setNumberFormat("0.00%")
       var choices = item.getChoices();
       var endCol = colName(nextCol+choices.length-1);
       //SpreadsheetApp.getUi().alert("merging "+startCol+"1:"+endCol+"1");
       MSumSheet.getRange(startCol+"1:"+endCol+"1").merge()
       for(var j = 0;j <choices.length;j++){
            var answer = choices[j].getValue();
            var curCol = colName(nextCol)
            var sourcCol = colName(k+3)   //the first three are Timestamp, Email Aaddress, Score
            var header = MSumSheet.getRange(curCol+"2").setValue(answer)
            if(choices[j].isCorrectAnswer()){
              header.setFontWeight("bold");
            }
            MSumSheet.getRange(curCol+"3").setFormula("=if(isna("+curCol+"5),0,counta("+curCol+"5:"+curCol+"))")
            MSumSheet.getRange(curCol+"4").setValue("=if(sum("+startCol+"3:"+endCol+"3)=0, NA(), "+curCol+"3/(sum("+startCol+"3:"+endCol+"3)))")
            MSumSheet.getRange(curCol+"5").setFormula("=query(importRange(\""+ss.getUrl()+"\",\"Form Responses 1!A2:"+sourcCol+"\"),\"select Col2 where Col"+(k+4)+" = '"+answer+"'\")");
            //Logger.log("query for "+question+", "+answer+": "+query)
            nextCol++;
        }

  }

  
}

function colName(n) {
    var ordA = 'A'.charCodeAt(0);
    var ordZ = 'Z'.charCodeAt(0);
    var len = ordZ - ordA + 1;

    var s = "";
    while(n >= 0) {
        s = String.fromCharCode(n % len + ordA) + s;
        n = Math.floor(n / len) - 1;
    }
    return s;
}

function isCorrect(answer){
  const correct = /^\*.+/
  if(answer){
    if(correct.test(answer)){
       return true;
     }
  }
  return false;

}

function doGet(e){
  fileName = e.parameter["fileName"]
  quizName = e.parameter["quizName"]
  createGradedQuiz(fileName, quizName, false);
  var sProperty = PropertiesService.getScriptProperties();
  var url = sProperty.getProperty("formUrl");
  var name = quizName
  var html = '<html><body><a href="'+url+'" target="blank" onclick="google.script.host.close()">'+name+'</a></body></html>';
  var ui = HtmlService.createHtmlOutput(html)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  return ui;
}

