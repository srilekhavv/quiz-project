# Quiz-Project
copies files from github to google drive and converts them to google form quizzes

# Markdown Format
1. The title of the markdown file plus the quiz creation date will be the title of the quiz file. 
2. Each question starts with a hyphen plus a space (“- “) with no indentation in front.
3. The answers follow the question. It should start with a tab and then a hyphen plus a space
4. The correct answer for a question is marked by an asterisk right after the markers above.
5. Images follows the standard Markdown format:
  - `![alt text](url)`
  - The alt text will not be displayed. Caption should be put before the exclamation mark but after the asterisk, if there is one.
  - Since GAS doesn’t support adding images inside questions, the images will be extracted and added individually as image items, and the questions will refer to their captions. If captions are empty, the letters a-z will be used as place holders.
  
An example markdown file:
https://drive.google.com/file/d/1GgpPwrvCrz2Cp25Idvtp6Oc-otVCKz-N/view?usp=sharing

The generated quiz looks like this:
https://docs.google.com/forms/d/1IKO8rtJ2fWd41IECjkS_B06PWMYHGf8zF68Oq89N8k4/edit?usp=sharing



# How to Install
1. Make a copy of this template 
  - https://docs.google.com/spreadsheets/d/1bnAGLxQgV5LOPX5CdPuxqbKiKLNN8QbJpcMIu5gQHzY/edit?usp=sharing 
2. On the spreadsheet, go to Tools and select Script Editor. There are a few variables at the top of Code.gs and CreateQuiz.gs that need to be initialized, so fill them in.
3. To set up OAuth2 for connecting your Google Drive to GitHub. Follow the directions on this website starting from Step 3 https://www.benlcollins.com/apps-script/oauth-github/
  - You don’t need to copy the code that they give, because the code in this script follows that format
4. If that all works out, click on the Script Menu tab and select Create Copy of Repo. That will create a Folder you named that has copies of the files in the associated GitHub repository. 
  - It will also create the quizzes and associated spreadsheet for those files
  - The current code only works for G suite accounts. To use it for other accounts, remove “.setRequireLogin(true)” in newQuizInFolder() in CreateQuiz.gs
5. If you committed changes to GitHub and want them updated in your GoogleDrive, go to Script Menu and select Update
  - This will update your files, but it will not create/update the quizzes associated with those files.
  - If you deleted a file, and it does not change in the main Spreadsheet, then you can remove it manually from the Spreadsheet. That will not mess up anything
  - If you add images, make sure the are jpg, otherwise they will not be copied over
6. To create new quizzes for newly created files, highlight the files you want quizzes for with your cursor, and go to Script Menu and select Create Quizzes. 
