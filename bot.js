const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const youtubedl = require('youtube-dl');
const config = require('./config');
const { info } = require('console');

// replace the value below with the Telegram token you receive from @BotFather
//const token = '1366787295:AAEusoSsRXy8hXoprVZYCXSkohGJWUEyucE';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.bot.token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

/**
 * Saves a music session providing a youtube link
 */
bot.onText(/\/link (.+)/, (msg, link) => {
    const chatId = msg.chat.id;
    //const urlRegex = new RegExp("https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)");
    /* bot.onText(urlRegex, (msg, link) => {
        bot.sendMessage(chatId, "La url coincide");
    }); */
    //const resp = match[1]; //youtube link
    
    const video = youtubedl(link[1],
  // Optional arguments passed to youtube-dl.
    ['--format=18'],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname });
    
    // Will be called when the download starts.
    video.on('info', function(info) {
        console.log('Download started');
        console.log('filename: ' + info._filename);
        console.log('size: ' + info.size);
    });
    
    video.pipe(fs.createWriteStream('/home/plaza/sesioneoMusic/filename.mp4'));
    bot.sendMessage(chatId,"Sesion guardada");
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
});

bot.on('audio', (msg) => {
    const chatId = msg.chat.id;

    //const audioName = audio.file_id;
    const audiotTitle = msg.audio.title;
    bot.sendMessage(chatId, `Nombre del fichero ${audiotTitle}`).catch((error) => {
        console.log(error.code);  // => 'ETELEGRAM'
        console.log(error.response.body); // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
      });
});
