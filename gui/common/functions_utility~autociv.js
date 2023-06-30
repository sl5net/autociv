var g_linkLongTeam = null; // init should be available during the game and not changed

var g_lastCommand = "";
// var g_lastCommandID = 0;
var g_lastCommandIDmax = 5;
var g_lastCommandID = parseInt (Engine.ConfigDB_GetValue("user", `autocivP.chat.g_lastCommandID`));
if(isNaN(g_lastCommandID))g_lastCommandID = 0;
// warn('g_lastCommandID = ' + g_lastCommandID); // selfMessage function dont work here



/**
 * @param {*} text - Slice of the text from start to buffer position
 * @param {*} list - List of texts to try to auto-complete
 * @param {*} tries - Number of times to try to autocomplete
 */
tryAutoComplete = function (text, list, tries)
{
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
    for (var word of list)
    {
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
    if (tries >= 0)
    {
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

var autoCompleteText_newMerge = function (guiObject, list)
{
    // selfMessage('324: autoCompleteText_newMerge')
    let caption = guiObject.caption.trim()
    if (!caption.length){
        // selfMessage(`repeat you last(id = ${g_lastCommandID}) command:`) // message disabled becouse its also inside the looby. could disturbing a bit.
        let lastCommand;
        if( !isNaN(g_lastCommandID) && g_lastCommandID >= 0 )
            lastCommand = Engine.ConfigDB_GetValue("user", `autocivP.chat.lastCommand${g_lastCommandID}`);
        else{
            error('23-0628_0020-57')
            selfMessage(`ERROR: g_lastCommandID = ${g_lastCommandID}`)
        }
        if(!lastCommand)
            return

        if(g_lastCommand == lastCommand){
            // selfMessage(`70: '${lastCommand}' = lastCommand`);

            // let nextID = getNextLastCommandID()
            let nextID = g_lastCommandID

            const nextCommand = Engine.ConfigDB_GetValue("user", `autocivP.chat.lastCommand${nextID}`);
            if(nextCommand && nextCommand.length){
                g_lastCommand = nextCommand;
                g_lastCommandID = nextID;
            }
            // endoOf g_lastCommand == lastCommand
        }else{
            // g_lastCommand != lastCommand
            // selfMessage(`76: g_lastCommand='${g_lastCommand}' != '${lastCommand}' = lastCommand`);
            g_lastCommand = lastCommand;
            // g_lastCommandID++;
            // if(g_lastCommandID > g_lastCommandIDmax) g_lastCommandID = 0;
        }// endoOf g_lastCommand != lastCommand
        // let test = g_ChatHistory[1]; // g_ChatHistory is not defined https://trac.wildfiregames.com/ticket/5387

        if(g_lastCommand.length)
            caption = g_lastCommand ;
        // End of caption is empty
    }else{
        // caption is not empty
        // selfMessage('TAB and caption is not empty')

        const maxCaptionLengthAllowed = 30 // test crashed by 150
        if(caption.length > maxCaptionLengthAllowed)
        {
            // selfMessage(`maxCaptionLengthAllowed = ${maxCaptionLengthAllowed}`)
            // seems this prefent from the error // Retrieve the substring of the last n characters
            // CStr CStr::Right(size_t len) const { ENSURE(len <= length()); return substr(length()-len, len); }
            return
        }

        if(caption == g_lastCommand){
            let nextID = getNextLastCommandID()

            // selfMessage(`86: ${g_lastCommandID}' = g_lastCommandID`);
            // selfMessage(`164: nextID = ${nextID}'`);
            let nextCommand = Engine.ConfigDB_GetValue("user", `autocivP.chat.lastCommand${nextID}`);

            if( !(nextCommand && nextCommand.length)
                && g_lastCommandID > 0 )
            {
                    nextID = 0
                    nextCommand = Engine.ConfigDB_GetValue("user", `autocivP.chat.lastCommand${nextID}`);
                    // selfMessage(`172: nextID = ${nextID}'`);
            }

            if(nextCommand && nextCommand.length){
                g_lastCommand = nextCommand;
                g_lastCommandID = nextID;
                // caption = nextCommand ;
                guiObject.caption = nextCommand; // use of guiObject.caption not caption solved a seldom critical crash
                return;
            }else{
                selfMessage('never heppens? 23-0628_1307-15')
            }
            // selfMessage(`caption == g_lastCommand '${caption}' => double tab ?`);
            // EndOf caption == g_lastCommand
        }

        ConfigDB_CreateAndSaveValueA26A27("user", `autocivP.chat.g_lastCommandID`, g_lastCommandID); // !! dont deltete !! if delte also /p profilles dont get storede into the config file 23-0628_1338-23
        // selfMessage(`g_lastCommand = ${g_lastCommand}`)
        // Enof caption is not empty
    }

    const doTabReplacmentWor_gl_hf_gg_wp_stuff = true; // usefull for debugging maybe
    if(doTabReplacmentWor_gl_hf_gg_wp_stuff){
            /*
            erros when i not host:

    ERROR: Errors executing script event "Tab"
    ERROR: JavaScript error: gui/common/functions_utility~autociv.js line 107
    sendMessageGlHfWpU2Gg is not defined
    autoCompleteText@gui/common/functions_utility~autociv.js:107:9
    ChatInputPanel.prototype.autocomplete@gui/lobby/LobbyPage/Chat/ChatInputPanel~autociv.js:13:21
    ERROR: Errors executing script event "Tab"

            */
            // selfMessage(`161: caption = ${caption}`);
            // if(caption == 'gl' || caption == 'hf'){
            //     // guiObject.caption = 'Have fun!(hf).'; //  and invite your friends
            //     guiObject.caption = 'Have fun'; //  and invite your friends
            //     captionTime1 = caption.toString();
            // }else if(caption == 'gg'){
            //     // selfMessage(`166: caption = ${caption}`);
            //     // guiObject.caption = 'Well played(wp)';
            //     guiObject.caption = 'Good game';
            //     captionTime1 = caption;
            // }else if(caption == 'wp'){
            //     // guiObject.caption = 'Well played(wp)'; //  Again?(re)
            //     guiObject.caption = 'Well played';
            //     captionTime1 = caption;
            // }else if(caption == 're'){
            //     // guiObject.caption = 'Well played(wp)'; //  Again?(re)
            //     guiObject.caption = 'Again?'; //  Again?(re)
            //     captionTime1 = caption;
            // }else if(caption == 'u2'){
            //     guiObject.caption = 'You too';
            //     captionTime1 = caption;
            // }
            // captionTime1 = caption.toString();
            // got error as obser but worked stoff before worked very nice. so let use a try catch or check if its observer:  (se, 23-0618_1531-46)

            // try {
                let text = translateGlHfWpU2Gg(caption.toString());
                if(text.length){
                    guiObject.caption = text;
                    // selfMessage('always ?') // no not always. works like expected 23-0628_0232-14
                    return;
                }
            // } catch (error) {
                // not needet to send. its also good to have changed the captio only 23-0618_1532-39
            // }
             // 23-0618_1452-21 return is needet. otherwise guiObject.caption = ... changes nothing

            // return; // <== ver dangeoous then eventually all other commands dont work
        }

    // selfMessage('caption = ' + caption)
    if(caption == 'j'){
        if(gameState != "ingame"){
            let text = `to use jiti in you team: 1. open Ally-Chat 2. write j<tab> then enter. 3. write li<tab> or /link`
            selfMessage(text)
            return
        }

        if (g_linkLongTeam == null) {
            let linkidShort = Date.now().toString().substring(10);
            // not open this link always. if you have it already probably
            g_linkLongTeam = `https://meet.jit.si/0ad${linkidShort}audio`;
            // doOpenJitsiLink = true;
            if(false){ // maybe better not use it at the moment. maybe later. in a future version. to much confusion
                try {
                    openURL(g_linkLongTeam); // its not necesary. if error use /link later
                } catch (error) {

                }
            }
        }
        //   selfMessage(Engine.team[0]); // state is not defined
          caption = g_linkLongTeam;
          const inviteJitsiText =  `Please open following link for team-audio-chat in your web browser. If you have the mod AutoCiv open it by writing /link<enter>. Only a web browser is required. ${g_linkLongTeam} `;
        //   guiObject.caption = '/link'; //  inviteJitsiText;
          guiObject.caption = inviteJitsiText;
        //   sendMessage(`${inviteJitsiText}`); // TODO: it send to all not only to Allied

        // selfMessage(g_linkLongTeam); // its only a selfMessage. not read by botManager
        // BotManager.openURL(g_linkLongTeam); // is not a function
        // let err = botManager.openLink(g_linkLongTeam); // is not a function


        // botManager.setMessageInterface("ingame");
        // let err = botManager.get("link").openLink(g_linkLongTeam); // this get the link from the chat.
        // if (err)
        //     selfMessage(err);

        return;
    }
    if(caption == 'li'){
        guiObject.caption = '/link';
        return;
    }
    if(caption == 'whatsAutocivPMod'){
        guiObject.caption = whatsAutocivPMod;
        return;
    }

    // selfMessage('caption.toLowerCase() = ' + caption.toLowerCase());


    if(caption.toLowerCase() == 'hiall'){
        const key = "autocivP.gamesetup.helloAll";
        const helloAll = Engine.ConfigDB_GetValue("user", key);
        if(!helloAll)
            selfMessage('helloAll is empty.');
        guiObject.caption = helloAll
        selfMessage('set /hiAll yourWelcomeText or use /hiAll yourWelcomeText or send by /hiAll or helloAll tab, to edit it first.');
        return;
    }
    // selfMessage('caption = ' + caption)
    // Engine.ConfigDB_CreateAndSaveValue("user", "autocivP.chat.lastCommand", caption); // is not a function error in Version a26 aut 23-0605_1920-25
    const sameTry = autoCompleteText.state.newCaption == caption
    if (sameTry)
    {

        // selfMessage(282)
        const textBeforeBuffer = autoCompleteText.state.oldCaption.substring(0, autoCompleteText.state.buffer_position)
        // selfMessage(284)
        const completedText = tryAutoComplete(textBeforeBuffer, list, autoCompleteText.state.tries++)
        // selfMessage(286)
        const newCaptionText = completedText + autoCompleteText.state.oldCaption.substring(autoCompleteText.state.buffer_position)
        // selfMessage(288)

        autoCompleteText.state.newCaption = newCaptionText

        guiObject.caption = newCaptionText

        // ConfigDB_CreateAndSaveValueA26A27("user", "autocivP.chat.lastCommand", newCaptionText);
        try {
            saveLastCommand2History(newCaptionText);
        } catch (error) {
            // happens in the lobby console when double press tab 23-0622_2013-26
            error('double pressed tab to fast?')
        }
        // selfMessage(295)
        guiObject.buffer_position = autoCompleteText.state.buffer_position + (completedText.length - textBeforeBuffer.length)
        // selfMessage(297)
    }
    else
    {
        const buffer_position = guiObject.buffer_position
        autoCompleteText.state.buffer_position = buffer_position
        autoCompleteText.state.oldCaption = caption
        autoCompleteText.state.tries = 0

        const textBeforeBuffer = caption.substring(0, buffer_position)
        const completedText = tryAutoComplete(textBeforeBuffer, list, autoCompleteText.state.tries++)
        const newCaptionText = completedText + caption.substring(buffer_position)

        autoCompleteText.state.newCaption = newCaptionText

        // selfMessage('324');
        guiObject.caption = newCaptionText
        // selfMessage('326');
        guiObject.buffer_position = buffer_position + (completedText.length - textBeforeBuffer.length)
        // selfMessage('328');
    }
}

// autoCompleteText = autoCompleteText_original
autoCompleteText = autoCompleteText_newMerge


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
function brightenedColor(color, brightnessThreshold = 110)
{
    // check if a cached version is already available
    let key = `${color} ${brightnessThreshold}`
    if (!autociv_ColorsSeenBefore[key])
    {
        let [r, g, b] = color.split(" ").map(x => +x);
        let i = 0;
        while (r * 0.299 + g * 0.587 + b * 0.114 <= +brightnessThreshold)
        {
            i += 0.001;
            const [h, s, l] = rgbToHsl(r, g, b);
            [r, g, b] = hslToRgb(h, s, l + i);
        }
        autociv_ColorsSeenBefore[key] = [r, g, b].join(" ");
    }
    return autociv_ColorsSeenBefore[key];
}

function ConfigDB_CreateAndSaveValueA26A27(user, key, value){



    // ConfigDB_CreateAndSaveValue is not a function error in Version a26 but in a27 23-0605_1920-25
    if(!user || !key || value.length <= 0  ){
        // error('23-0625_0609-52');
        warn(`!user=${user} || !key=${key} || !value=${value}`)
        return false;
    }

    if(versionOf0ad != '0.0.26')
        Engine.ConfigDB_CreateAndSaveValue(user, key.toString(), value.toString()); // maybe 0.0.26 or higher
    else{
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
