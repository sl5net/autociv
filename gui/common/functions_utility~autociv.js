// Engine.IncludeScript("gui/common/functions_utility~autociv.js"); // Error: is not a function
// const functionsUtility = require("gui/common/functions_utility~autociv.js"); // Error: is not defined



var g_linkLongTeam = null; // init should be available during the game and not changed

var g_lastCommand = "";
// var g_lastCommandID = 0;
var g_lastCommandIDmax = 5;
var g_lastCommandID = parseInt(Engine.ConfigDB_GetValue("user", `autocivP.chat.g_lastCommandID`));


var g_iconPrefix = Engine.ConfigDB_GetValue("user", "autocivP.chat.iconPrefix").trim(); // icon prefix iconPrefix should be default <

// warn(`g_iconPrefix = >${g_iconPrefix}<`);

var g_previousCaption = ''

if (isNaN(g_lastCommandID)) g_lastCommandID = 0;
// warn('g_lastCommandID = ' + g_lastCommandID); // selfMessage function dont work here


/**
 * @param {*} text - Slice of the text from start to buffer position
 * @param {*} list - List of texts to try to auto-complete
 * @param {*} tries - Number of times to try to autocomplete
 */
tryAutoComplete = function (text, list, tries) {
  if (!text.length)
    return text

  const wordSplit = text.split(/\s/g)
  if (!wordSplit.length)
    return text

  // Get last single word from text until the buffer position
  const lastWord = wordSplit.pop()
  if (!lastWord.length)
    return text

  let firstFound = ""
  for (var word of list) {
    if (word.toLowerCase().indexOf(lastWord.toLowerCase()) != 0)
      continue

    if (!firstFound)
      firstFound = word

    --tries
    if (tries < 0)
      break
  }

  if (!firstFound)
    return text

  // Wrap search to start, cause tries could not complete to 0, means there are no more matches as tries in list.
  if (tries >= 0) {
    autoCompleteText.state.tries = 1
    word = firstFound
  }

  text = wordSplit.join(" ")
  if (text.length > 0)
    text += " "

  return text + word
}

// var autoCompleteText_original = function (guiObject, list) // this works without errors
// {
//     const caption = guiObject.caption
//     if (!caption.length)
//         return

//     const sameTry = autoCompleteText.state.newCaption == caption
//     if (sameTry)
//     {
//         const textBeforeBuffer = autoCompleteText.state.oldCaption.substring(0, autoCompleteText.state.buffer_position)
//         const completedText = tryAutoComplete(textBeforeBuffer, list, autoCompleteText.state.tries++)
//         const newCaptionText = completedText + autoCompleteText.state.oldCaption.substring(autoCompleteText.state.buffer_position)

//         autoCompleteText.state.newCaption = newCaptionText

//         guiObject.caption = newCaptionText
//         guiObject.buffer_position = autoCompleteText.state.buffer_position + (completedText.length - textBeforeBuffer.length)
//     }
//     else
//     {
//         const buffer_position = guiObject.buffer_position
//         autoCompleteText.state.buffer_position = buffer_position
//         autoCompleteText.state.oldCaption = caption
//         autoCompleteText.state.tries = 0

//         const textBeforeBuffer = caption.substring(0, buffer_position)
//         const completedText = tryAutoComplete(textBeforeBuffer, list, autoCompleteText.state.tries++)
//         const newCaptionText = completedText + caption.substring(buffer_position)

//         autoCompleteText.state.newCaption = newCaptionText

//         guiObject.caption = newCaptionText
//         guiObject.buffer_position = buffer_position + (completedText.length - textBeforeBuffer.length)
//     }
// }


/**
 * @param {Object} guiObject - the GUI object
 * @param {Array} list - the list of items
 * @return {undefined} - no return value
 */
const g_autoCompleteText_newMerge = (guiObject, list) => {
  // selfMessage('100: autoCompleteText_newMerge')
  // selfMessage('101: caption.length = ' + guiObject.caption.length)

  chatInputTooltipQuickFixUpdate()

  // warn(`22: last text was >${g_chatTextInInputFild_when_msgCommand}<`);

  const caption = guiObject.caption
  // let caption = guiObject.caption.trim()  // used long time to trim the caption to 23-0705_2249-00 idk if it may dangerous to trim here

  let bugIt = false // new implementation so i will watch longer
  // bugIt = true &&  g_selfNick.includes("seeh") // new implementation so i will watch longer



  if (bugIt)
    selfMessage(`133: ${caption.toLowerCase()} = ${caption}      gui/common/functions_utility~autociv.js`) //TODO - add to json tab-commands


  // End of caption is maybe not empty

  // if(!caption) // trigers when no caption content is in
  if (!caption.length) { // trigers when no caption content is in
    if (bugIt)
      selfMessage(`137: ${caption} = ${caption} gui/common/functions_utility~autociv.js`)



    if (g_chat_draft.length > 0) // this fixes the problem with changing chat context via hotkey a bit. it saves last chat context temporarily and but it in again when you press tab 23-0724_1543-57
    {
      if (bugIt) {
        const debugMsg = `139: g_chat_draft = ${g_chat_draft}   gui/common/functions_utility~autociv.js`
        selfMessage(debugMsg)
      }

      if (gameState == 'ingame') {
        // in this state we want super careful
        guiObject.caption = truncateString(g_chat_draft.trim(), 80)
        guiObject.buffer_position = 0
      } else {
        guiObject.caption = g_chat_draft.trim()
        guiObject.buffer_position = 0
      }
      g_chat_draft = ''
      // g_chatTextInInputFild_when_msgCommand_lines = 0
      g_previousCaption = guiObject.caption

      if (bugIt)
        selfMessage(`165: return ||| caption = ${caption}  gui/common/functions_utility~autociv.js`)


      return
    }

    if (guiObject.caption == " " && setCaption2LastCommandOfHistory(guiObject)) {
      g_previousCaption = guiObject.caption

      /*
      now chat expand is better.
      ' '+<tab> shows the last command in the history
      <tab> again emptys the chat when it could not find a command that starts with your input
      */


      // a single space plus <tab> schould allowed trigger this.  25-0211_0224-52
      // sometimes old from history get in lobby, when you type beside. in a other editor. not in 0ad 25-0211_0224-52
      //     return false // thre its better to ignore this. when you are in lobby
      // warn(`1170: the toggle throw last commands in the history. is now limited to  if(caption == " "`)

      if (bugIt)
        selfMessage(`175: ${caption.toLowerCase()} = ${caption}      gui/common/functions_utility~autociv.js`) //TODO - add to json tab-commands

      return // now the caption is not empty anymore
    }
  } // end of caption not empty

  if (bugIt)
    selfMessage(`282: caption = ${caption}  gui/common/functions_utility~autociv.js`)


  if (inputCopySearchReults(guiObject))
    return

  //   selfMessage(`171:  '${g_lastCommand}' `);


  // if(g_previousCaption == 'communityModToggle'
  //   || g_previousCaption == 'mainlandTwilightToggle'){
  //   if(bugIt)
  //     selfMessage(`178: now now now   gui/common/functions_utility~autociv.js `);
  //     captionCheck_is_communityModToggle_OR_mainlandTwilightToggle_optional_restartOad(caption, true)
  // }

  if (caption?.length) {

    // if(caption == "help"){
    //   // selfMessage(`213: caption = ${caption}  gui/common/functions_utility~autociv.js`)
    //   // transGGWP_markedStrings_I('allicons', []) // works a bit ugly
    //   // translGGWP_splitInWords_II('allicons', []) // works a bit ugly
    //   translGGWP_U2Gg_III('allicons', [], true)
    //   // function translGGWP_U2Gg_III(gg, minMatchScore, reduceAmount = false) {
    //   return
    // }

    const match = caption.match(/^help(\d*)$/); // Use a regular expression
    if (match) {
      let pageNumber = 1; // Default to page 1
      if (match[1]) {
        pageNumber = match[1]; // Extract the captured group (the number)
      }

      const helpPageSize = 20; // Number of items per page

      const startIndex = (pageNumber - 1) * helpPageSize; // Calculate the start index
      const endIndex = startIndex + helpPageSize; // Calculate the end index


      selfMessage(`=======================`)
      selfMessage(`====== page ${pageNumber} ======`)
      translGGWP_U2Gg_III('allicons', [], true, startIndex, endIndex);
      // Update the caption to point to the next page (or loop back)
      const nextPageNumber = (pageNumber % 5) + 1;
      guiObject.caption = "help" + nextPageNumber;
      return;
    }

    if (caption == "prettyEnable") {
      warn(`188: caption = ${caption}  gui/common/functions_utility~autociv.js`)
      prettyGraphicsEnable()
      saveLastCommand2History(caption)
      return
    } else {
      if (caption == "prettyDisable") {
        warn(`194: caption = ${caption}  gui/common/functions_utility~autociv.js`)
        prettyGraphicsDisable()
        saveLastCommand2History(caption)
        return
      }
    }

    if (captionCheck_is_prettyToggle(caption, true)) {
      // dont remove to comand from the caption maybe. maybe he will try mor often.
      saveLastCommand2History(caption)
      return
    }


    if (bugIt)
      selfMessage(`222: caption = ${caption}  gui/common/functions_utility~autociv.js`)

    if (captionCheck_is_communityModToggle_OR_mainlandTwilightToggle_optional_restartOad(caption, true)) {
      if (bugIt)
        selfMessage(`196: communitymodtoggle  gui/common/functions_utility~autociv.js `);

      g_previousCaption = 'communityModToggle' // next time it should be restart then and do the chanches
      guiObject.caption = 'communityModToggle' // for some reason that i dont understand must be now lowercase not communityModToggle
      return
    }

    bugIt = false && g_selfNick.includes("seeh") // new implementation so i will watch longer
    if (bugIt)
      selfMessage(`234: caption = ${caption}  gui/common/functions_utility~autociv.js`)

    if (caption.length > 0) {
      // if (caption.toLowerCase() == 'msgall') {


      //   if(!sendChatTranslated(guiObject, g_chatTextInInputFild_when_msgCommand.trim, sourceLanguage, targetLanguage))
      //   {
      //     guiObject.caption = g_chatTextInInputFild_when_msgCommand.trim()
      //     g_previousCaption = guiObject.caption
      //     guiObject.buffer_position = 0 //  lastLinesString.length;
      //   }
      //   return
      // }
      // Example use: msg2es
      if (bugIt)
        selfMessage(`295: gameState = ${gameState}`)

      const match = caption.toLowerCase().match(/msg(\d+|all)([a-z]{2})?([a-z]{2})?/);
      if (match) {
        saveLastCommand2History(caption)
        const number = match[1];
        let sourceLanguage = 'en'
        let targetLanguage = null

        if (bugIt)
          selfMessage(`305: number = ${number}`)
        // return

        if (match[3]) {
          sourceLanguage = match[2]
          targetLanguage = match[3]
        } else if (match[2]) {
          targetLanguage = match[2]
        }

        // selfMessage(`221: number = ${number}  sourceLanguage = ${sourceLanguage}  targetLanguage = ${targetLanguage}`)

        // Handle the extracted number
        // selfMessage('gui/common/functions_utility~autociv.js ' + )
        const linesArray = g_chatTextInInputFild_when_msgCommand.trim().split('\n');
        const lastLines = number == 'all' ? linesArray : linesArray.slice(-number);
        const lastLinesString = lastLines.join('\n');

        if (bugIt)
          selfMessage(`315: lastLinesString = ${lastLinesString} , linesArray.length = ${linesArray.length}  `)

        if (bugIt)
          selfMessage(`327: stringify=>>${JSON.stringify(linesArray)}<< , linesArray.length = ${linesArray.length}  `)


        if (!sendChatTranslated(guiObject, lastLinesString, sourceLanguage, targetLanguage)) {
          if (bugIt)
            selfMessage(`328: lastLinesString = ${lastLinesString} , linesArray.length = ${linesArray.length}  `)
          guiObject.caption = lastLinesString
          g_previousCaption = guiObject.caption
          guiObject.buffer_position = 0 //  lastLinesString.length;
        }

        ConfigDB_CreateAndSaveValueA26A27("user", "autocivP.chat.copyAllChatMessages", "true"); // if want select messages from all you net th have all chat messages first/next. => so set the flag to true
        return
      }
    }

    switch (caption.toLowerCase()) {

      // return captionIs_j(guiObject);
      case 'sp':
        return caption2_spanish(guiObject);
      case 'j':
        return captionIs_j(guiObject);
      case 'li':
        guiObject.caption = '/link';
        return;
      case 'whatsAutocivPMod'.toLowerCase():
        guiObject.caption = whatsAutocivPMod;
        return;
      case 'whatsCommunityMod'.toLowerCase():
        guiObject.caption = whatsCommunityMod;
        return;
      case 'whatsReplay_pallas'.toLowerCase():
        guiObject.caption = whatsReplay_pallas;
        return;
      case 'whatsModernGUIA27'.toLowerCase():
        guiObject.caption = whatsModernGUIA27;
        return;
      case 'legend'.toLowerCase():
        guiObject.caption = `legend: ♤ proGUI mod, ♇ autocivP mod`
        return;
      case '/legend'.toLowerCase():
        guiObject.caption = `legend: ♤ proGUI mod, ♇ autocivP mod`
        return;
      case 'hiall':
        return captionIs_hiall(guiObject);
      case 'me':
        return captionIs_me(guiObject);
      case 'meurl':
        return captionIs_meURL(guiObject);
      case 'meu': // synonym. if you in hurry
        return captionIs_meURL(guiObject);
      case 'modsImCurrentlyUsing'.toLowerCase():
        return captionIs_modsImCurrentlyUsing(guiObject);
      // selfMessage('caption.toLowerCase() = ' + caption.toLowerCase());
      case 'timeNow'.toLowerCase():
        // selfMessage('162: caption.toLowerCase() = ' + caption.toLowerCase());
        /*!SECTION
        todo: this is not working in lobby. needs implementd again
        JavaScript error:
        gui/common/functions_utility~autociv.js line 163
        g_NetworkCommands['/whatstimeNow'] is not a function
        */
        try {
          // return g_NetworkCommands["/whatstimeNow"]() // is not a function


          const today = new Date();
          const hours = today.getHours().toString().padStart(2, '0');
          const minutes = today.getMinutes().toString().padStart(2, '0');
          const text = `it's ${hours}:${minutes} here.`
          const chatInput = Engine.GetGUIObjectByName("chatInput");

          // chatInput.focus()
          chatInput.caption = text;
          chatInput.buffer_position = text.length



        } catch (error) {
          selfMessage('inside lobby whatstimeNow is not a function, at the moment. and there is no will to fix it at the moment ;) Motivate me. its not so very importand command. other stuff is fine.');
          if (g_selfNick == "seeh") { //NOTE -  developers want to see the error in the console
            warn(error.message)
            warn(error.stack)
          }
          return
        }
        return

    } // switch end

    const firstChar = caption.toString().charAt(0); // or str[0]

    // selfMessage(`283: doppelPosting? '${g_lastCommand}' `);
    // selfMessage(`284: g_lastCommand = '${g_lastCommand}' , caption = '${caption}' `);

    if (bugIt)
      selfMessage(`287: '${g_previousCaption}' ?= '${caption}'  gui/common/functions_utility~autociv.js `);

    if (g_previousCaption == caption) { // g_lastCommand
      // selfMessage(`290: doppelPosting? '${g_lastCommand}' gui/common/functions_utility~autociv.js `);

      const firstChar = caption.charAt(0); // or str[0]
      if (firstChar.match(/[‹›]/)) {
        g_previousCaption = caption
        return remove_delimiters_from_chat_icon_message(guiObject, caption);

      }

      if (bugIt)
        selfMessage(`300: doppelPosting? '${g_lastCommand}' | captionCheck_is_communityModToggle_optional_restartOad |  gui/common/functions_utility~autociv.js `);
      captionCheck_is_communityModToggle_OR_mainlandTwilightToggle_optional_restartOad(caption, true) // if is communitymodtoggle restart

      if (bugIt)
        selfMessage(`304: tries = ${autoCompleteText.state.tries} |  gui/common/functions_utility~autociv.js `);


      if (autoCompleteText.state.tries != 1 && setCaption2nextCommandOfHistory(guiObject)) {
        g_previousCaption = caption
        return
      }
    } // end of doppelPosting


    // const textBeforeBuffer = autoCompleteText.state.oldCaption.substring(0, autoCompleteText.state.buffer_position)
    // const textBeforeBuffer = guiObject.caption



    // selfMessage('caption = ' + caption)
    // Engine.ConfigDB_CreateAndSaveValue("user", "autocivP.chat.lastCommand", caption); // is not a function error in Version a26 aut 23-0605_1920-25
    const sameTry = (autoCompleteText.state.newCaption == caption)
    if (sameTry) {

      if (bugIt) selfMessage(`autoCompleteText.state.tries = ${autoCompleteText.state.tries} 324`);


      if (autoCompleteText_sameTry_eg_userName_civName(guiObject, list)) {
        return // such result should not be saved in the command history. therefore return
      } else {
        if (bugIt)
          selfMessage(`331: doppelPosting? '${g_lastCommand}' gui/common/functions_utility~autociv.js `);
        g_previousCaption = guiObject.caption

      }

    } else {
      if (bugIt)
        selfMessage(`338:  gui/common/functions_utility~autociv.js `);

      if (autoCompleteText_firstTry_eg_userName_civName(guiObject, caption, list)) {
        g_previousCaption = guiObject.caption
        return // such result should not be saved in the command history. therefore return
      }
      g_previousCaption = guiObject.caption

    }



    if (is_transGGWP_needet(caption, firstChar, g_iconPrefix, guiObject)) {
      const captionBegin = caption.toString()
      let captionTrimed = captionBegin.substring(g_iconPrefix.length)
      const minMatchScore = (captionTrimed.length > 20) ? 0.8 : (g_iconPrefix.length ? 0.3 : g_minMatchScore)
      // const minMatchScore = (captionTrimed.length > 20) ? 0.8 : (g_iconPrefix.length ? 0.3 :  0.55 )
      // user name will be replaced later. i want have .3 but some users dont be found so easy ... hmmm // user name will be replaced later. i want have .3 but some users dont be found so easy ... hmmm // user name will be replaced later. i want have .3 but some users dont be found so easy ... hmmm

      // selfMessage(`355: gameState '${gameState}' `);
      if (gameState == "ingame") {
        // Help me ☞here
        const pattern = /^help\b/i;
        const hasPattern = pattern.test(guiObject.caption);
        if (hasPattern) {
          //  selfMessage(`361: gameState '${gameState}' `);
          captionTrimed = 'helpme' // ingame ist much more importand when help pings other team players then list all the commands via the /help command. more important to have a easy comunication with team. make sure that thiy keyword is still i the json file
        }
      }

      // let allIconsInText =  Engine.Translate( transGGWP_markedStrings_I(captionTrimed, minMatchScore) )
      let allIconsInText = transGGWP_markedStrings_I(captionTrimed, minMatchScore)

      const key = "autocivP.chat.no_icon_delimiters";
      const no_icon_delimiters = (Engine.ConfigDB_GetValue("user", key) === "true")
      if (no_icon_delimiters)
        allIconsInText = remove_delimiters_from_chat_icon_message(guiObject, allIconsInText);


      try {
        const guiObject = Engine.GetGUIObjectByName("chatInput");
        // guiObject.blur(); // remove the focus from a GUI element.
        guiObject.focus();
        if (bugIt)
          selfMessage('230: allIconsInText = ' + allIconsInText);

        if (captionBegin != allIconsInText) {
          const isCaptionNumeric = (allIconsInText[0] >= '0' && allIconsInText[0] <= '9')
          if (isCaptionNumeric)
            allIconsInText = `  ${allIconsInText}`
          // add two spaces to the beginning so user can easily change the number to and add later maybe a name (ping user) at the very beginning

          if (gameState != "ingame") { // prefent for unwanted replacments for e.g. in gamesetup
            // 90 metal please
            const pattern = /\d+ \w+ please/;
            const hasPattern = pattern.test(allIconsInText);
            if (hasPattern) {

              if (bugIt)
                selfMessage(`392: gameState '${gameState}' `);
              return
            }
          }

          if (guiObject.caption == allIconsInText) {
            if (bugIt)
              selfMessage(`452: caption == allIconsInText`);
          } else {
            g_previousCaption = captionTrimed
          }
          guiObject.caption = allIconsInText

          guiObject.buffer_position = isCaptionNumeric ? 2 : allIconsInText.length;

          // sets the buffer/corsor position to the beginning

          if (gameState == "ingame") {
            const pattern = /\d+ \w+ please/;
            const hasPattern = pattern.test(allIconsInText);
            if (hasPattern)
              guiObject.buffer_position = 2 // set cursor to beginning of this(btw there a spaces before): 90 food please
          }

          if (true) {
            // ‹away from keyboard
            // selfMessage(`413: away from keyboard`)
            const pattern = /away from keyboard/;
            const hasPattern = pattern.test(allIconsInText);
            if (hasPattern) {
              guiObject.buffer_position = (no_icon_delimiters) ? 20 : 21 // set cursor to beginning of this(btw there a spaces before): 90 food please
            }
          }

          // g_lastCommand = allIconsInText
          // saveLastCommand2History(captionTrimed) // not everything should be saved. only the important commands. not all chat content

          // if(setCaption2nextCommandOfHistory(guiObject)){
          //   g_previousCaption = guiObject.caption
          //   return
          // }


          return // this return was maybe missing 23-0705_2302-57 without this return some crases happened in oberver mode !!!!!! 23-0705_2305-59
        }
      } catch (error) {

        if (g_selfNick == "seeh") { //NOTE - 23-0705_2302-57 developers want to see the error in the console
          warn('290: ' + error.message)
          warn('291: ' + error.stack)
        }
      }
    }
    // if(g_lastCommand == caption){
    //   selfMessage(`441: doppelPosting? '${g_lastCommand}' `);
    //   setCaption2nextCommandOfHistory(guiObject)
    // }
    if (g_previousCaption == caption) { // || g_lastCommand == caption

      // selfMessage(`445: doppelPosting? '${g_lastCommand}' `);
      if (bugIt) {
        selfMessage(`505: dont found the command '${caption}' `);
        selfMessage(`506: command before was command '${g_previousCaption}' `);
      }
      // whats about command msg1 msg2 msg3 ????
      // tats in line 232



      // double tab could maybe mean icons should be removed
      // are nonalphabetic characters in the string?
      const hasMoreThanAscii = /^[\u0000-\u007f]*$/.test(caption);
      if (!hasMoreThanAscii) {
        if (bugIt)
          selfMessage(`445: nonalphabetic characters found '${caption}' `);
      } else {

        if (caption.length < 10) { // be careful with this command. overwrite text that someone else was typing and was not very sort
          if (setCaption2nextCommandOfHistory(guiObject)) {
            g_previousCaption = guiObject.caption
            if (bugIt)
              selfMessage(`507: g_previousCaption = ${g_previousCaption}`);
          }

          // setCaption2nextCommandOfHistory(guiObject)

        }
      } // end of if( caption.length < 10 )
      return

    } // end of if(g_lastCommand == caption)

  }

  // try test send flare. dont work
  // let minimapPanel = Engine.GetGUIObjectByName("minimapPanel")
  // minimapPanel.children[2].focus();
  // let objName = 'flar'
  // selfMessage(`461: ${objName} = ${objName}`)

  g_previousCaption = caption


};


/**
 * Auto completes the text AGAIN in the given GUI object using the provided list of options.
 *
 * @param {object} guiObject - The GUI object to autocomplete the text in.
 * @param {array} list - The list of options to use for autocompletion.
 */
function autoCompleteText_sameTry_eg_userName_civName(guiObject, list) {

  let bugIt = false // new implementation so i will watch longer
  // bugIt = true &&  g_selfNick.includes("seeh") // new implementation so i will watch longer

  const textBeforeBuffer = autoCompleteText.state.oldCaption.substring(0, autoCompleteText.state.buffer_position)
  const completedText = tryAutoComplete(textBeforeBuffer, list, autoCompleteText.state.tries++)
  const newCaptionText = completedText + autoCompleteText.state.oldCaption.substring(autoCompleteText.state.buffer_position)
  autoCompleteText.state.newCaption = newCaptionText
  try {
    guiObject.caption = newCaptionText
    guiObject.focus()
  } catch (error) {
    if (g_selfNick == "seeh") { //NOTE - 23-0705_2302-57 developers want to see the error in the console
      warn(error.message)
      warn(error.stack)
    }
  }
  // ConfigDB_CreateAndSaveValueA26A27("user", "autocivP.chat.lastCommand", newCaptionText);
  try {
    // saveLastCommand2History(newCaptionText);     // not everything should be saved. only the important commands. not all chat content
  } catch (error) {
    // happens in the lobby console when double press tab 23-0622_2013-26
    if (bugIt) { //NOTE - 23-0705_2302-57 developers want to see the error in the console
      error('double pressed tab to fast?')
      warn(error.message)
      warn(error.stack)
    }
  }

  if (guiObject.caption.charAt(0) !== '/') {  // if you want toggle through the / commands it should be different from the the behavior wen you pink somebody
    if (bugIt)
      selfMessage(`508: textBeforeBuffer = '${textBeforeBuffer}' gui/common/functions_utility~autociv.js`)
    guiObject.buffer_position = autoCompleteText.state.buffer_position + (completedText.length - textBeforeBuffer.length)
  }

  if (textBeforeBuffer != completedText) { // || g_lastCommand == caption
    // warn(`370: true`)
    return true
  }
  return false
}


/**
 * Auto complete a given text like userName, civName in a user interface field.
 *
 * @param {Object} guiObject - the GUI object representing the user interface field.
 * @param {string} caption - the current caption of the user interface field.
 * @param {Array} list - the list of possible auto complete options.
 * @return {boolean} true if the auto complete was successful, false otherwise.
 */
function autoCompleteText_firstTry_eg_userName_civName(guiObject, caption, list) {
  let bugIt = false // new implementation so i will watch longer
  // bugIt = true &&  g_selfNick.includes("seeh") // new implementation so i will watch longer

  const buffer_position = guiObject.buffer_position
  autoCompleteText.state.buffer_position = buffer_position
  autoCompleteText.state.oldCaption = caption
  autoCompleteText.state.tries = 0

  const textBeforeBuffer = caption.substring(0, buffer_position)
  if (bugIt) {
    selfMessage(`540: \n\n gui/common/functions_utility~autociv.js`);
    selfMessage(`541: textBeforeBuffer = ${textBeforeBuffer}`);
  }
  let completedText = tryAutoComplete(textBeforeBuffer, list, autoCompleteText.state.tries++)
  if (caption.charAt(0) !== '/') {
    const usernamePattern = /^[\S]+\s\([^()]*\)/i;
    // const username = "seeh (1205)";

    if (usernamePattern.test(completedText))
      completedText += ' ' // e.g. username ith a space helps to fast write next text

  }

  const newCaptionText = completedText + caption.substring(buffer_position)



  autoCompleteText.state.newCaption = newCaptionText

  if (bugIt) {
    selfMessage(`560: completedText = ${completedText}`);
    selfMessage(`561: tries = ${autoCompleteText.state.tries}`);
    selfMessage(`562: newCaptionText = ${newCaptionText}`);
    selfMessage(`563: completedText = ${completedText}`);
  }

  try {
    guiObject.caption = newCaptionText
    guiObject.focus();

    if (caption.charAt(0) === '/') {
      if (bugIt) selfMessage(`571: -----------------------------------------`)
      // asumption that are slash commands maybe you want toggle through them
      // guiObject.buffer_position = (textBeforeBuffer.length)
    } else {
      if (bugIt) selfMessage(`575: =========================================`)
      // if you want ping a user the cursor should be later at the end
      guiObject.buffer_position = buffer_position + (completedText.length - textBeforeBuffer.length)
    }

    if (bugIt) {
      selfMessage(`581: buffer_position = ${guiObject.buffer_position}`);
      selfMessage(`582: textBeforeBuffer = ${textBeforeBuffer}`);
    }

    if (textBeforeBuffer != completedText) { // || g_lastCommand == caption
      return true
    }

  } catch (error) {
    if (g_selfNick == "seeh") { //NOTE - 23-0705_2302-57 developers want to see the error in the console
      warn('396' + error.message)
      warn('397' + error.stack)
    }
  }
  return false
}

/*!SECTION
autoCompleteText cannot renamed in:
gui/common/functions_utility~autociv.js line 431
becouse then you get a error:
assignment to undeclared variable g_autoCompleteText
==> its defined in external
*/
autoCompleteText = g_autoCompleteText_newMerge // gui/common/functions_utility~autociv.js
// autoCompleteText = autoCompleteText_original


/* autoCompleteText.state is not a global variable. It is a property of the autoCompleteText object.
The autoCompleteText object is defined above in the code, and the .state property is used to store and track the previous texts for auto-completion.
This object is likely used within the scope of the module or function where it is defined.
*/
// Used to track previous texts from autocompletion to try next autocompletion if multiples apply.
autoCompleteText.state = {
  "buffer_position": 0,
  "newCaption": "",
  "oldCaption": "",
  "tries": 0
}


// Use the JS cache, instead of recomputing the same color
const autociv_ColorsSeenBefore = {};

/**
 * Some text colors must become brighter so that they are readable on dark backgrounds.
 * Modified version from gui/lobby/LobbyPage/PlayerColor.GetPlayerColor
 * Additional check for "perceived brightness", if the color is already bright enough don't change it,
 * otherwise go up in small incremental steps till it is bright enough.
 * https://www.w3.org/TR/AERT/#color-contrast
 * @param   {string}  color                 string of rgb color, e.g. "10 10 190" ("Dark Blue")
 * @param   {number}  brightnessThreshold   Value when a color is considered bright enough; Range:0-255
 * @return  {string}                        string of brighter rgb color, e.g. "100 100 248" ("Blue")
*/
function brightenedColor(color, brightnessThreshold = 110) {
  // check if a cached version is already available
  let key = `${color} ${brightnessThreshold}`
  if (!autociv_ColorsSeenBefore[key]) {
    let [r, g, b] = color.split(" ").map(x => +x);
    let i = 0;
    while (r * 0.299 + g * 0.587 + b * 0.114 <= +brightnessThreshold) {
      i += 0.001;
      const [h, s, l] = rgbToHsl(r, g, b);
      [r, g, b] = hslToRgb(h, s, l + i);
    }
    autociv_ColorsSeenBefore[key] = [r, g, b].join(" ");
  }
  return autociv_ColorsSeenBefore[key];
}

function ConfigDB_CreateAndSaveValueA26A27(user, key, value, isEmptyAvalueAllowed = false) {
  // ConfigDB_CreateAndSaveValue is not a function error in Version a26 but in a27 23-0605_1920-25
  if (!user || !key || (!isEmptyAvalueAllowed && value.length <= 0)) {
    // error('23-0625_0609-52');
    // warn(`!user=${user} || !key=${key} || !value=${value} info: isEmptyAvalueAllowed=${isEmptyAvalueAllowed}`);
    return false;
  }

  if (versionOf0ad != '0.0.26')
    Engine.ConfigDB_CreateAndSaveValue(user, key.toString(), value.toString()); // maybe 0.0.26 or higher
  else {
    Engine.ConfigDB_CreateValue(user, key, value);
    Engine.ConfigDB_WriteFile(user, "config/user.cfg");
  }
  return

  // try {
  //     Engine.ConfigDB_CreateAndSaveValue(user, key.toString(), value.toString());
  // } catch (error) {
  //     Engine.ConfigDB_CreateValue(user, key, value);
  //     Engine.ConfigDB_WriteFile(user, "config/user.cfg");
  // }
};









function saveThisModProfile(nr, autoLabelManually) {
  const modsFromUserCfg_const = Engine.ConfigDB_GetValue(
    "user",
    "mod.enabledmods"
  );
  const name = "modProfile.p" + nr;
  const isEmptyAvalueAllowed = true
  const modProfile = Engine.ConfigDB_GetValue("user", name);
  const nameLabel = "modProfile.p" + nr + "label";

  // warn("check if ModProfiles has changed")

  const modProfile_alwaysIn_Key = 'modProfile.alwaysIn'
  const modProfile_alwaysIn_Default = 'autocivp'
  const mo = Engine.ConfigDB_GetValue("user", modProfile_alwaysIn_Key);
  if (!mo)
    ConfigDB_CreateAndSaveValueA26A27("user", modProfile_alwaysIn_Key, modProfile_alwaysIn_Default)

  const alwaysInReplayDefaultsKey = 'modProfile.alwaysInReplay'
  const alwaysInReplayDefaults = 'boonGUI'
  const modProfilealwaysInReplay = Engine.ConfigDB_GetValue("user",);
  if (!modProfilealwaysInReplay && modProfilealwaysInReplay != "")
    ConfigDB_CreateAndSaveValueA26A27("user", alwaysInReplayDefaultsKey, alwaysInReplayDefaults)

  if (!modProfile) { // add defaults
    // warn("133")
    let clean = "";
    switch (nr) {
      case 0: // p0
        clean = modsFromUserCfg_const.replaceAll(/[^\w\d\-]+/g, " ");
        break;
      case 1:
        clean = "no-blood-and-gore-mod"; // proGUI was removed from default 23-0730_1210-33
        break;
      case 2:
        clean = "community-mod proGUI";
        break;
      case 3:
        clean = "boonGUI";
        break;
      case 4:
        clean = "community-maps-2 kush-extreme 10ad";
        break;
      case 5:
        clean = "mainland-twilight";
        break;
      default:
        error('should no happen');
        break;
    }

    ConfigDB_CreateAndSaveValueA26A27("user", name, clean, isEmptyAvalueAllowed)

    const cleanLabel = clean.replaceAll(/([^ ]{3})[^ ]+/g, "$1");
    ConfigDB_CreateAndSaveValueA26A27("user", nameLabel, cleanLabel, isEmptyAvalueAllowed)

  } else {
    let clean = modProfile.replaceAll(/[^\w\d\-]+/g, " ");

    const showDebugWarning = false
    if (clean != modProfile) {
      // correct profile if necesarry
      ConfigDB_CreateAndSaveValueA26A27("user", name, clean, isEmptyAvalueAllowed)
      if (showDebugWarning) warn("modProfile.p" + nr + " saved with =" + clean + "=");
    }
    if (!autoLabelManually) {
      const cleanLabel = clean.replaceAll(/([^ ]{3})[^ ]+/g, "$1");
      ConfigDB_CreateAndSaveValueA26A27("user", nameLabel, cleanLabel, isEmptyAvalueAllowed)
      if (showDebugWarning) warn("autoLabel" + nr + " saved with =" + cleanLabel + "=");
    }
  }
}
function enableThisModProfile(nr) {
  // Engine.ConfigDB_GetValue("user", "modProfile.p" + nr + "enabled") == "true"
  if (
    Engine.ConfigDB_GetValue("user", "modProfile.activeProfile") == nr

  ) {
    const modsFromUserCfg_const = Engine.ConfigDB_GetValue(
      "user",
      "mod.enabledmods"
    );
    const profKey = "modProfile.p" + nr;
    const modProfile = Engine.ConfigDB_GetValue("user", profKey);
    let clean = '';



    clean =
      "mod public " +
      modProfile.replaceAll(/\b(mod\s+public)\b\s*/g, "")

    clean = addModProfileAlwaysInAlsoAddAutocivPatTheEnd(clean)


    if (clean != modsFromUserCfg_const) {
      warn("833: save:" + nr);
      warn('834:' + clean);

      // function RestartEngine(): any;



      if (gameState == "ingame") {
        warn(`in games autoRestart is disabled`)
        ConfigDB_CreateAndSaveValueA26A27("user", "mod.enabledmods", clean)
      } else {
        const clean_array = clean.trim().split(/\s+/);
        ConfigDB_CreateAndSaveValueA26A27("user", 'mod.enabledmods', clean)
        print('#### RestartEngine() 967 in gui/common/functions_utility~autociv.js ####')
        Engine.SetModsAndRestartEngine(["mod", ...clean_array])
        Engine.SetModsAndRestartEngine(["mod", ...Engine.GetEnabledMods()])

        // BTW when you want resarte but mod not changed you need call this function twice
        // Engine.SetModsAndRestartEngine(["mod",...clean_array])
        // Engine.SetModsAndRestartEngine(["mod",...Engine.GetEnabledMods()])
        // print('857: clean_array: ' + JSON.stringify(clean_array) )
        // print('858: modsEnabled: ' + JSON.stringify(modsEnabled) )
      }


      return clean;
    } else {
      // warn("dont save " + nr);
    }

  }
  // its not different nothing was needet to change
  return false;
}

function check_modProfileSelector_settings() {

  const autoLabelManually = Engine.ConfigDB_GetValue("user", "modProfile.autoLabelManually") === "true";
  const name = "modProfile.activeProfile" // modProfile.activeProfile
  const activeProfileNr = Engine.ConfigDB_GetValue("user", name)

  if (activeProfileNr > 0 && enableThisModProfile(activeProfileNr)) {
    warn(`${activeProfileNr} was enabled as your default mod-configuration.`);
    ConfigDB_CreateAndSaveValueA26A27("user", name, "false");
    return true;
  }
  return false;
}


// function addModProfileAlwaysInAlsoAddAutocivPatTheEnd(clean){
//   const modProfileAlwaysIn = Engine.ConfigDB_GetValue("user", 'modProfile.alwaysIn');
//   const modProfileAlwaysInArray = modProfileAlwaysIn.split(/\s/);
//   modProfileAlwaysInArray.forEach(value => {
//     const regex = new RegExp('\b' + value + '\b\s*' ,'gi');
//     clean = clean.replaceAll(regex, ""); // mod\s+public is default. boring to save it
//   })
//   // autocivP its at the end and shoud at the end
//   if(clean.indexOf(' autocivP')<=0)
//     clean += ' autocivP'
//   clean = clean.replaceAll('autocivP', `${modProfileAlwaysIn} autocivP` ); // mod\s+public is default. boring to save it
//   return clean
// }

function addModProfileAlwaysInAlsoAddAutocivPatTheEnd(clean) {
  const modProfileAlwaysIn = Engine.ConfigDB_GetValue("user", 'modProfile.alwaysIn');


  const modProfileAlwaysInArray = modProfileAlwaysIn.split(/\s/);

  modProfileAlwaysInArray.forEach(value => {
    const regexPattern = new RegExp('\b' + value + '\b\s*', 'gi');
    const regex = new RegExp(regexPattern, 'gi');
    clean = clean.replaceAll(regex, "");
  });

  if (!clean.toLowerCase().includes(' autocivp'))
    clean += ' autocivp';

  return clean.replace(/\bautocivP\b/ig, `${modProfileAlwaysIn} autocivp`);
}

function caption2_spanish(guiObject) {
  const targetLanguage = 'es';

  const number = 3;
  const linesArray = g_chatTextInInputFild_when_msgCommand.trim().split('\n');
  const lastLines = linesArray.slice(-number);
  const lastLinesString = lastLines.join('\n');


  guiObject.caption = translateText(lastLinesString, targetLanguage)

}
function captionIs_j(guiObject) {

  // "Select chat addressee." "Everyone"=0 "Allies"=1 Enemies=2 Observers=3
  const chatAddressBox = Engine.GetGUIObjectByName("chatAddressee"); // found this name in binaries/data/mods/public/gui/session/chat/chat_window.xml

  if (gameState != "ingame" || chatAddressBox.selected != 1) { // 1 is Allies
    let text = `to use jiti in you team: 1. open Ally-Chat 2. write j⟦Tab⟧ then enter. 3. write li⟦Tab⟧ or /link`
    selfMessage(text)
    return
  }

  if (true) {
    const linkidShort = Date.now().toString().substring(10);
    // not open this link always. if you have it already probably
    // g_linkLongTeam = `https://meet.jit.si/0ad${linkidShort}audio`;

    const key = "autocivP.jitsiServerList";
    const jitsiAddress = Engine.ConfigDB_GetValue("user", key)
    if (!jitsiAddress) {
      error(`please set jitsiAddress in user config first`)
      return false
    } else {
      g_linkLongTeam = `https://${jitsiAddress}`
        + `/0ad${linkidShort}audio`;
    }

    // doOpenJitsiLink = true;
    if (false) { // maybe better not use it at the moment. maybe later. in a future version. to much confusion
      try {
        openURL(g_linkLongTeam); // its not necesary. if error use /link later
      } catch (error) {

      }
    }
  }
  //   selfMessage(Engine.team[0]); // state is not defined
  // caption = g_linkLongTeam;
  const inviteJitsiText = `If the team-audio-chat link does does not automatically open in your web browser, type li⟦Tab⟧ or /link<enter>. Only a web browser is required. ${g_linkLongTeam} `;
  //   guiObject.caption = '/link'; //  inviteJitsiText;

  sendMessage(inviteJitsiText);

  setTimeout(() => {
    try {
      let err = botManager.get("link").openLink(0);
      if (err)
        selfMessage(err);
    } catch (error) {
      // Handle the error gracefully or simply ignore it
      warn(`109: ${error} | gui/common/functions_utility~autociv.js`);
    }
  }, 80);

  guiObject.buffer_position = 0
  guiObject.caption = ''


  // guiObject.caption = inviteJitsiText;




  //   sendMessage(`${inviteJitsiText}`); // TODO: it send to all not only to Allied

  // selfMessage(g_linkLongTeam); // its only a selfMessage. not read by botManager
  // BotManager.openURL(g_linkLongTeam); // is not a function
  // let err = botManager.openLink(g_linkLongTeam); // is not a function


  // botManager.setMessageInterface("ingame");
  // let err = botManager.get("link").openLink(g_linkLongTeam); // this get the link from the chat.
  // if (err)
  //     selfMessage(err);

  return true;

}

function captionIs_me(guiObject) {
  const key = "autocivP.msg.me";
  const text = Engine.ConfigDB_GetValue("user", key);
  if (!text)
    selfMessage('me is empty.');
  else
    guiObject.caption = text
  return;
}
function captionIs_meURL(guiObject) {
  const key = "autocivP.msg.meURL";
  const text = Engine.ConfigDB_GetValue("user", key);
  if (!text)
    selfMessage('url is empty.');
  else
    guiObject.caption = text
  return;
}
function captionIs_hiall(guiObject) {
  const key = "autocivP.msg.helloAll";
  const helloAll = Engine.ConfigDB_GetValue("user", key);
  if (!helloAll)
    selfMessage('helloAll is empty.');
  else
    guiObject.caption = helloAll
  selfMessage('set /hiAll yourWelcomeText or use /hiAll yourWelcomeText or send by /hiAll or helloAll tab, to edit it first.');
  return;
}
function captionIs_modsImCurrentlyUsing(guiObject) { // this function will be triggerd from by in game chat
  const enabledmods = Engine.ConfigDB_GetValue(
    "user",
    "mod.enabledmods"
  );
  // sendMessage(`Mods I'm currently using: ${enabledmods.slice(11,)}` );
  let text = `Mods I'm currently using: ${enabledmods.slice(11,)} ${g_previous_autocivPVersion}`;
  text = text.replace('localratings', 'localRatings♒') //  ♡ autocivP❧♣▦▣ mod
  text = text.replace('feldmap', 'feldMap▦') //  ♡ autocivP❧♣▦▣ mod

  text = text.replace('proGUI', 'proGUI♤') //  ♡ autocivP❧♣▦▣ mod
  // text = text.replace('autocivP', 'autocivP☼') //  ♡ autocivP❧♣▦▣ mod
  text = text.replace(/\bautocivP\b/ig, 'autocivP♇') //  ♡ autocivP❧♣▦▣ mod

  guiObject.caption = text;
  guiObject.buffer_position = text.length
  return;
}

/**
 * Remove special tags delimiter from the caption and update the GUI object's caption.
 *
 * @param {Object} guiObject - The GUI object to update.
 * @param {string} caption - The caption to process.
 */
function remove_delimiters_from_chat_icon_message(guiObject, caption) {
  caption = caption.replace(/[‹›]/g, ''); // cut out all special tags delimiter
  g_lastCommand = caption
  // guiObject.caption = caption
  // selfMessage(`161 ${caption.toLowerCase()} = ${caption}`)
  // selfMessage(`169 ${caption}`)
  guiObject.caption = caption
  return caption
}

/**
 * Determines if the function is transGGWP_needet.
 *
 * @param {string} caption - The caption parameter.
 * @param {string} firstChar - The firstChar parameter.
 * @param {string} iconPrefix - The iconPrefix parameter.
 * @param {object} guiObject - The guiObject parameter.
 * @return {boolean} The result of the function.
 */
function is_transGGWP_needet(caption, firstChar, iconPrefix, guiObject) {
  const doTabReplacmentWor_gl_hf_gg_wp_stuff = true; // usefull for debugging maybe
  return doTabReplacmentWor_gl_hf_gg_wp_stuff
    &&
    (
      caption.length > 1 // prevent conflict with seldon username
      ||
      !firstChar.match(/[a-z]/i) // not a  a-z(ignoreCase) first lettter
    )
    &&
    // !firstChar.match(/[A-Z]/) // not Upercase A-Z first lettter. Upercase is not recomanded as seach words. especially not in a shorter text. Now fixed: Ha => Han, before it was Ha => hand
    !caption.match(/\b[A-Z]/) // not Upercase word start A-Z in caption. more strict. Easier to explain and maybe easier to use and remeber this rule, then only use this rule for the first letter
    &&
    (
      caption.length <= 90 //NOTE - 300 maybe too long . prefent multiple repacment
      || guiObject.buffer_position > 14 // maybe user want gg wp replacments in a longer text and cursor is in the middle or at the end
    )
    &&
    (
      !iconPrefix.length && firstChar != '/'
      ||
      firstChar == iconPrefix
    )
}

function setCaption2LastCommandOfHistory(guiObject) {

  // if( gameState == "lobby" ) // sometimes old from history get in lobby, when you type beside. in a other editor. not in 0ad 25-0211_0224-52
  //     return false // thre its better to ignore this. when you are in lobby


  let doDebug = false // debug session
  // doDebug = true // debug session

  let lastCommand;
  const is_g_lastCommandID_correkt = (!isNaN(g_lastCommandID) && g_lastCommandID >= 0)

  if (is_g_lastCommandID_correkt) {
    lastCommand = Engine.ConfigDB_GetValue("user", `autocivP.chat.lastCommand${g_lastCommandID}`);


    // if(gameState == "ingame" || isSelfHost() != true){
    if (gameState == "ingame" || g_selfIsHost != true) {
      if (/^\/p|^\/\d/.test(lastCommand)) { //  /p or /\d
        // selfMessage(`hide mapCofigProfileComands in ingame state ( ${lastCommand} )`)
        g_lastCommandID = getNextLastCommandID()
        return true
      }
    }


  } else {
    error('23-0628_0020-57')
    selfMessage(`ERROR: g_lastCommandID is not correct.`)
  }
  if (!lastCommand)
    return false

  if (doDebug)
    selfMessage(`1119: lastCommand = ${lastCommand}`)

  g_previousCaption = guiObject.caption
  guiObject.caption = lastCommand
  g_lastCommand = lastCommand
  return true
}

/**
 * Sets the caption of the next command in the history to the given GUI object.
 *
 * @param {Object} guiObject - The GUI object to set the caption to.
 * @return {boolean} Returns true if the caption is successfully set, false otherwise.
 */
function setCaption2nextCommandOfHistory(guiObject) {
  let nextID = getNextLastCommandID()
  g_lastCommandID = nextID;
  // selfMessage(`1136: >>>>>>>>${g_lastCommandID}<<<<<<<< ' = g_lastCommandID`);
  // selfMessage(`1137: nextID = ${nextID}'  gui/common/functions_utility~autociv.js`);
  let nextCommand = Engine.ConfigDB_GetValue("user", `autocivP.chat.lastCommand${nextID}`);
  // selfMessage(`1139: >>>${nextCommand}<<<  gui/common/functions_utility~autociv.js`);
  // autocivP.chat.lastCommand4 = "jajaja"

  // if(isSelfHost() != true)
  //   selfMessage(`1143: g_selfInHost = ${g_selfInHost}`)


  // if(gameState == "ingame" || isSelfHost() != true){ // obsolete
  if (gameState == "ingame" || g_selfIsHost != true) {
    if (/^\/p|^\/\d/.test(nextCommand)) { //  /p or /\d
      // selfMessage(`hide mapCofigProfileComands in ingame state ( ${nextCommand } )`)
      g_lastCommandID = getNextLastCommandID()
      return false
    }
  }


  if (!(nextCommand?.length)) {
    nextID = 0
    nextCommand = Engine.ConfigDB_GetValue("user", `autocivP.chat.lastCommand${nextID}`);
    // selfMessage(`1160: nextID = ${nextID}, g_lastCommandID = ${g_lastCommandID}, nextCommand = ${nextCommand}`);
    g_lastCommandID = nextID;
    // selfMessage(`1162: ${g_lastCommandID}' = g_lastCommandID  gui/common/functions_utility~autociv.js`);
    if (!(nextCommand?.length))
      return false
  }

  if (nextCommand?.length) {
    g_lastCommand = nextCommand;
    g_lastCommandID = nextID;
    // caption = nextCommand ;
    g_previousCaption = guiObject.caption
    guiObject.caption = nextCommand; // use of guiObject.caption not caption solved a seldom critical crash
    // selfMessage(`1173: nextID = ${nextID}, g_lastCommandID = ${g_lastCommandID}, nextCommand = ${nextCommand}`);
    return true;
  }
  // selfMessage('never heppens? 23-0628_1307-15')
  // selfMessage(`775 nextID = ${nextID}, g_lastCommandID = ${g_lastCommandID}, nextCommand = ${nextCommand}`);
  // g_lastCommandID = nextID;
  return false
}



/**
 * Checks if the caption is "communityModToggle" and performs certain actions based on the caption.
 *
 * @param {string} caption - The caption to be checked.
 * @param {boolean} doRestart0ad - Optional parameter to indicate whether to restart 0ad.
 *                                Defaults to false.
 * @return {boolean} Returns true if the caption is "communityModToggle" and
 *                   doRestart0ad is false. Otherwise, returns false.
 */
function captionCheck_is_prettyToggle(caption, doRestart0ad = false) {
  if (caption.trim() != "prettyToggle") {
    return false;
  }
  // if(gameState == "ingame"){
  //   selfMessage(`prettyToggle is not allowed in ingame.`)
  //   return false
  // }
  // if(!doRestart0ad){
  //   return true
  // }
  const sharpness = Engine.ConfigDB_GetValue(
    "user",
    "sharpness"
  );
  const isPrettyMode = sharpness > 0.1

  if (isPrettyMode) {
    prettyGraphicsDisable()
    selfMessage(`pretty mode is disabled.`)
  } else {
    prettyGraphicsEnable()
    selfMessage(`pretty mode is enabled.`)
  }
  return true
}

/**
 * Enables pretty graphics settings. Aims to maximize visual fidelity, potentially at the cost of performance.
 * Contains a backup/restore mechanism for toggling.
 * Includes intelligent handling of water effects dependencies.
 * Includes sky visibility and upscaling technique.
 *
 * @return {void} No return value.
 */
let prettyGraphicsBackup = {}; // Store backup for easy toggling.

function prettyGraphicsEnable() {

  // Check if a backup exists. If so, restore the settings instead of applying "pretty" defaults.
  if (Object.keys(prettyGraphicsBackup).length > 0) {
    restoreSettings();
    return; // Exit after restoring, so we don't apply "pretty" defaults again.
  }

  backupSettings(); // Create a backup of the current settings.

  // Antialiasing smooths jagged edges. MSAA8 provides a good balance between quality and performance.  HIGH IMPORTANCE for visual quality.
  ConfigDB_CreateAndSaveValueA26A27("user", "antialiasing", "msaa8");

  // Fog adds atmospheric depth. Can have a moderate performance impact, especially on large maps. MEDIUM IMPORTANCE.
  ConfigDB_CreateAndSaveValueA26A27("user", "fog", "true");

  // max_actor_quality controls the level of detail of units and other actors. Higher values look better but use more resources.  MEDIUM/HIGH IMPORTANCE, especially with many units on screen.  150 is quite high; consider if it needs to be this high.
  ConfigDB_CreateAndSaveValueA26A27("user", "max_actor_quality", "150");

  // shadowpcf enables Percentage Closer Filtering for shadows, making them softer and more realistic.  HIGH IMPORTANCE for visual quality.
  ConfigDB_CreateAndSaveValueA26A27("user", "shadowpcf", "true");

  // shadowquality controls the resolution of shadows. Higher values look better but are more expensive.  MEDIUM IMPORTANCE. 1 is a reasonable starting point.
  ConfigDB_CreateAndSaveValueA26A27("user", "shadowquality", "1");

  // shadows enables or disables shadows. Disabling this can significantly improve performance. HIGH IMPORTANCE for performance.
  ConfigDB_CreateAndSaveValueA26A27("user", "shadows", "true");

  // Sharpness adjusts the level of detail in the image. Subtle adjustments can improve clarity without significant performance impact. LOW IMPORTANCE.  The given value is within a reasonable range, but the ideal value is subjective.
  ConfigDB_CreateAndSaveValueA26A27("user", "sharpness", "0.14656737446784973");

  // textures.quality controls the resolution of textures. Higher values look better but require more VRAM.  HIGH IMPORTANCE for visual quality and VRAM usage. 1 is the highest setting.
  ConfigDB_CreateAndSaveValueA26A27("user", "textures.quality", "1");

  ConfigDB_CreateAndSaveValueA26A27("user", "textures.maxanisotropy", "16");

  // Water effects: Enable base effects and fancy effects for visual fidelity
  ConfigDB_CreateAndSaveValueA26A27("user", "watereffects", "true");
  ConfigDB_CreateAndSaveValueA26A27("user", "waterfancyeffects", "true");

  //Since waterreflection and waterrefraction only have effect when watereffects = true, we enable those too
  ConfigDB_CreateAndSaveValueA26A27("user", "waterreflection", "true");
  ConfigDB_CreateAndSaveValueA26A27("user", "waterrefraction", "true");

  // Show sky: Enable sky rendering for visual appeal.  Can have a slight performance impact.
  ConfigDB_CreateAndSaveValueA26A27("user", "showsky", "true");

  // Upscaling: Use a higher-quality upscaling technique (e.g., bilinear) for better visuals.  May have a slight performance cost compared to pixelated.
  ConfigDB_CreateAndSaveValueA26A27("user", "renderer.upscale.technique", "bilinear");

  // materialmgr.quality  Likely controls overall material quality. HIGH IMPORTANCE.  Adjusted to a higher setting for better visuals
  ConfigDB_CreateAndSaveValueA26A27("user", "materialmgr.quality", "1.213517665863037");

}

/**
 * Disables pretty graphics settings. Aims to maximize performance, potentially at the cost of visual fidelity.
 * Contains a backup/restore mechanism for toggling.
 * Includes intelligent handling of water effects dependencies.
 * Includes sky visibility and upscaling technique.
 *
 * @return {undefined} No return value.
 */
function prettyGraphicsDisable() {
  // Check if a backup exists. If so, restore the settings instead of applying "pretty" defaults.
  if (Object.keys(prettyGraphicsBackup).length > 0) {
    restoreSettings();
    return; // Exit after restoring, so we don't apply "pretty" defaults again.
  }


  backupSettings(); // Create a backup of the current settings.

  if (prettyGraphicsBackup["graphics.corpses.max"] > 50) {
    ConfigDB_CreateAndSaveValueA26A27("user", "autociv.session.graphics.corpses.max", "50");
  }

  // Antialiasing disabled improves performance. HIGH IMPORTANCE for performance.
  ConfigDB_CreateAndSaveValueA26A27("user", "antialiasing", "disabled");

  // Fog adds atmospheric depth. Can have a moderate performance impact, especially on large maps. MEDIUM IMPORTANCE. Disabling it could increase performance.
  ConfigDB_CreateAndSaveValueA26A27("user", "fog", "false");

  // max_actor_quality controls the level of detail of units and other actors. Lowering it significantly improves performance, especially with many units on screen. MEDIUM/HIGH IMPORTANCE. 100 is a reasonable low setting.
  ConfigDB_CreateAndSaveValueA26A27("user", "max_actor_quality", "100");

  // shadowpcf enables Percentage Closer Filtering for shadows. HIGH IMPORTANCE for visual quality.  Disabling it improves performance.
  ConfigDB_CreateAndSaveValueA26A27("user", "shadowpcf", "false");

  // shadowquality controls the resolution of shadows. Lower values improve performance. MEDIUM IMPORTANCE. Setting to -1 likely disables shadows.
  ConfigDB_CreateAndSaveValueA26A27("user", "shadowquality", "-1");

  // shadows enables or disables shadows. Disabling this can significantly improve performance. HIGH IMPORTANCE for performance.
  ConfigDB_CreateAndSaveValueA26A27("user", "shadows", "false");

  // Sharpness adjusts the level of detail in the image. LOW IMPORTANCE.  The given value is within a reasonable range, but the ideal value is subjective.
  ConfigDB_CreateAndSaveValueA26A27("user", "sharpness", "0.09461931884288788");

  // textures.quality controls the resolution of textures. Lower values improve performance. HIGH IMPORTANCE. 0 is the lowest setting.
  ConfigDB_CreateAndSaveValueA26A27("user", "textures.quality", "0");

  ConfigDB_CreateAndSaveValueA26A27("user", "textures.maxanisotropy", "1");

  // Water effects: Disable all water effects for maximum performance
  ConfigDB_CreateAndSaveValueA26A27("user", "watereffects", "false");
  ConfigDB_CreateAndSaveValueA26A27("user", "waterfancyeffects", "false");

  //Waterreflection and waterrefraction depend on watereffects, so we disable those too.
  ConfigDB_CreateAndSaveValueA26A27("user", "waterreflection", "false");
  ConfigDB_CreateAndSaveValueA26A27("user", "waterrefraction", "false");

  // Show sky: Disable sky rendering for increased performance.
  ConfigDB_CreateAndSaveValueA26A27("user", "showsky", "false");

  // Upscaling: Use a pixelated upscaling technique for maximum performance.
  ConfigDB_CreateAndSaveValueA26A27("user", "renderer.upscale.technique", "pixelated");

  // materialmgr.quality  Likely controls overall material quality. HIGH IMPORTANCE.  Set to a lower setting for better performance
  ConfigDB_CreateAndSaveValueA26A27("user", "materialmgr.quality", "1.0"); // Or find a value that is lower.

}

/**
 * Backs up the current graphics settings to the `prettyGraphicsBackup` object.
 *
 * @return {void}
 */
function backupSettings() {
  prettyGraphicsBackup = {
    "graphics.corpses.max": Engine.ConfigDB_GetValue("user", "autociv.session.graphics.corpses.max"),

    "antialiasing": Engine.ConfigDB_GetValue("user", "antialiasing"),
    "fog": Engine.ConfigDB_GetValue("user", "fog"),
    "max_actor_quality": Engine.ConfigDB_GetValue("user", "max_actor_quality"),
    "shadowpcf": Engine.ConfigDB_GetValue("user", "shadowpcf"),
    "shadowquality": Engine.ConfigDB_GetValue("user", "shadowquality"),
    "shadows": Engine.ConfigDB_GetValue("user", "shadows"),
    "sharpness": Engine.ConfigDB_GetValue("user", "sharpness"),
    "textures.quality": Engine.ConfigDB_GetValue("user", "textures.quality"),
    "textures.maxanisotropy": Engine.ConfigDB_GetValue("user", "textures.maxanisotropy"),
    "watereffects": Engine.ConfigDB_GetValue("user", "watereffects"),
    "waterfancyeffects": Engine.ConfigDB_GetValue("user", "waterfancyeffects"),
    "waterreflection": Engine.ConfigDB_GetValue("user", "waterreflection"),
    "waterrefraction": Engine.ConfigDB_GetValue("user", "waterrefraction"),
    "showsky": Engine.ConfigDB_GetValue("user", "showsky"),
    "renderer.upscale.technique": Engine.ConfigDB_GetValue("user", "renderer.upscale.technique"),
    "materialmgr.quality": Engine.ConfigDB_GetValue("user", "materialmgr.quality")
  };
}

/**
 * Restores the graphics settings from the `prettyGraphicsBackup` object.
 * Clears backup after restore.
 *
 * @return {void}
 */
function restoreSettings() {
  if (Object.keys(prettyGraphicsBackup).length === 0) {
    return; // No backup to restore.
  }

  ConfigDB_CreateAndSaveValueA26A27("user", "autociv.session.graphics.corpses.max", prettyGraphicsBackup["graphics.corpses.max"]);


  ConfigDB_CreateAndSaveValueA26A27("user", "antialiasing", prettyGraphicsBackup["antialiasing"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "fog", prettyGraphicsBackup["fog"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "max_actor_quality", prettyGraphicsBackup["max_actor_quality"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "shadowpcf", prettyGraphicsBackup["shadowpcf"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "shadowquality", prettyGraphicsBackup["shadowquality"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "shadows", prettyGraphicsBackup["shadows"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "sharpness", prettyGraphicsBackup["sharpness"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "textures.quality", prettyGraphicsBackup["textures.quality"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "textures.maxanisotropy", prettyGraphicsBackup["textures.maxanisotropy"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "watereffects", prettyGraphicsBackup["watereffects"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "waterfancyeffects", prettyGraphicsBackup["waterfancyeffects"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "waterreflection", prettyGraphicsBackup["waterreflection"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "waterrefraction", prettyGraphicsBackup["waterrefraction"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "showsky", prettyGraphicsBackup["showsky"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "renderer.upscale.technique", prettyGraphicsBackup["renderer.upscale.technique"]);
  ConfigDB_CreateAndSaveValueA26A27("user", "materialmgr.quality", prettyGraphicsBackup["materialmgr.quality"]);

  prettyGraphicsBackup = {}; // Clear the backup after restoring.
}


/**
 * Checks if the caption is "communityModToggle" and performs certain actions based on the caption.
 *
 * @param {string} caption - The caption to be checked.
 * @param {boolean} doRestart0ad - Optional parameter to indicate whether to restart 0ad.
 *                                Defaults to false.
 * @return {boolean} Returns true if the caption is "communityModToggle" and
 *                   doRestart0ad is false. Otherwise, returns false.
 */
function captionCheck_is_communityModToggle_OR_mainlandTwilightToggle_optional_restartOad(caption, doRestart0ad = false) {
  const captiontrim = caption.trim()
  if (captiontrim == "communityModToggle"
    || captiontrim == "mainlandTwilightToggle"
    || captiontrim == "kateModToggle"
    || captiontrim == "kateToggle"
  ) {


    if (gameState == "ingame") {
      selfMessage(`...ModToggle is not allowed in ingame.`)
      return false
    }

    if (!doRestart0ad) {
      return true // yes the caption is communityModToggle, but do not restart0ad now
    }

    let enabledmods = Engine.ConfigDB_GetValue(
      "user",
      "mod.enabledmods"
    );
    selfMessage(`enabledmods = ${enabledmods}`);

    if (captiontrim == "mainlandTwilightToggle") {
      if (enabledmods.indexOf("mainland-twilight") == -1)
        enabledmods += ' mainland-twilight'
      else
        enabledmods = enabledmods.replace(/\s*\bmainland-twilight\b\s*/, " ")
    }

    if (captiontrim == "communityModToggle") {
      if (enabledmods.indexOf("community-mod") == -1)
        enabledmods += ' community-mod'
      else
        enabledmods = enabledmods.replace(/\s*\bcommunity-mod\b\s*/, " ")
    }

    if (captiontrim == "kateModToggle" || captiontrim == "kateToggle") {
      if (enabledmods.indexOf(" kate") == -1)
        enabledmods += ' kate'
      else
        enabledmods = enabledmods.replace(/\s*\bkate\b\s*/, " ")
    }

    ConfigDB_CreateAndSaveValueA26A27("user", "mod.enabledmods", enabledmods.trim())
    selfMessage(`enabledmods = ${enabledmods}`)
    print(`functions_utility~autociv.js:1598 saved: enabledmods = ${enabledmods}`)


    const clean_array = enabledmods.trim().split(/\s+/);
    Engine.SetModsAndRestartEngine(["mod", ...clean_array])
    Engine.SetModsAndRestartEngine(["mod", ...Engine.GetEnabledMods()])
  }
}







function truncateString(str, num) {
  if (str.length > num) {
    return str.slice(0, num) + "...";
  } else {
    return str;
  }
}


function inputCopySearchReults(chatInput) {
  /**
 * when:
 * 1. the tab key is pressed in the chat input.
 * 2. startsWith("s?")
 * 3. cursor is at the beginning of the chat input ==> chat is copied to the chat text
 */
  // warn(`1317 buffer_position: ${chatInput.buffer_position}`)
  const text = chatInput.caption
  const inFilterMode = text.startsWith("s?")
  if (!inFilterMode)
    return false

  if (text == "s?" && chatInput.buffer_position > 0) {
    chatInput.caption += g_selfNick
    return true
  }

  let chatText = Engine.GetGUIObjectByName("chatText")
  if (!chatText) {
    // chatText = chatInput // has no list property ingame state
    chatInput.caption = g_chatTextInInputFild_when_msgCommand
    return true
  }

  // warn(`1335 buffer_position: ${chatInput.buffer_position}`)
  let chatStr = ''
  chatText.list.filter(t => {
    chatStr += t.replace(/\[.*?\]/g, '');
  })


  chatInput.caption = chatStr
  return true
}

function translateText(textToTranslate = 'Hello, how are you?', sourceLanguage = 'en', targetLanguage = 'es') {
  const key = "autocivP.translateServerList";
  const translateServer = Engine.ConfigDB_GetValue("user", key)

  if (translateServer == "google") {
    return `https://translate.google.com/?sl=${sourceLanguage}&tl=${targetLanguage}&text=${encodeURIComponent(textToTranslate)}`;
  } else {
    return `https://www.deepl.com/de/translator#${sourceLanguage}/${targetLanguage}/${encodeURIComponent(textToTranslate)}`;
  }
};

function sendChatTranslated(guiObject, text, sourceLanguage, targetLanguage) {

  // bugIt = true &&  g_selfNick.includes("seeh") // new implementation so i will watch longer
  if (!targetLanguage) {
    // if(bugIt)
    //   error(`targetLanguage is empty.`)
    return false
  }

  if (sourceLanguage == targetLanguage) {
    error(`sourceLanguage == targetLanguage.`)
    return false
  }

  if (targetLanguage == 'sp') { // correct typo. sp for spanish is wrong
    targetLanguage = 'es' // spanish
  }


  const german = {
    "ä": "ae",
    "ö": "oe",
    "ß": "ss",
    "ü": "ue",
    "æ": "ae",
    "ø": "oe",
    "å": "aa",
    "é": "e",
    "è": "e"
  };

  for (const key in german) {
    text = text.replace(new RegExp(key, "g"), german[key]);
  }
  text = text.replace(/\[\n\t\r\s\W]+/gi, ' ')

  // dont send links to tranlater api
  text = text.replace(/[^\s]+:\/\/[^\s]+/gi, '…')

  const explainTranslation = `its translation from ${sourceLanguage} to ${targetLanguage} last lines`

  let translatedText = `${translateText(text, sourceLanguage, targetLanguage)}`

  const doHelloAutomaticSuggestionWhenJoinAgameSetup = Engine.ConfigDB_GetValue("user", "autocivP.msg.helloAutomaticSuggestionWhenJoinAgameSetup")
  if (doHelloAutomaticSuggestionWhenJoinAgameSetup == 'PLine') {
    translatedText += ` ${g_PLineGithub.replace(/https:\/\//, '')}`
  }


  if (gameState == "lobby") {
    // danger fo to be band becouse of profanity, when you exidently copy all chat messages and paste them back to chat as link
    // lastLinesString is probably a link now. but still dangerous efentually
    guiObject.caption = translatedText
    g_previousCaption = guiObject.caption
    guiObject.buffer_position = 0 //  lastLinesString.length;
  }
  else
    if (g_selfIsHost && g_selfIsHost === true) {
      sendMessage(translatedText)
      guiObject.caption = explainTranslation
      guiObject.buffer_position = explainTranslation.length
      setTimeout(() => {
        try {
          let err = botManager.get("link").openLink(0);
          if (err)
            selfMessage(err);
        } catch (error) {
          // Handle the error gracefully or simply ignore it
          warn(`109: ${error} | gui/common/functions_utility~autociv.js`);
        }
      }, 70); // sometimes a larger delay then 50 is needed here
    } else {
      guiObject.caption = translatedText + ' /link '
      guiObject.buffer_position = translatedText.length + 1
      // explainTranslation
    }

  return true
}
