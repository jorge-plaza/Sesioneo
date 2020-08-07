const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
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
  const url = "https://www.youtube.com/watch?v=PzL90bAAcX4";
  youtubedl.exec(url, ['-x', '--audio-format', 'mp3'], {}, function(err, output) {
    if (err) throw err
  
    console.log(output.join('\n'))
  });
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
    
    const video = youtubedl(link[1],['-x', '--audio-format', 'mp3', '--format=18','--audio-quality=0'],    
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname });
    
    video.on('error', function error(err) {
      console.log('error 2:', err)
      bot.sendMessage(chatId, `An error has ocurred: ${err}`);
    });

    // Will be called when the download starts.
    let size = 0
    video.on('info', function(info) {
      size = info.size
      let output = path.join(config.storage.direcotry,'/', info._filename);
      video.pipe(fs.createWriteStream(output));
    });
});

function playlist(url) {

  'use strict'
  const video = youtubedl(url,['-x', '--audio-format', 'mp3', '--format=18', '--audio-quality=0']);

  video.on('error', function error(err) {
    console.log('error 2:', err)
    bot.sendMessage(chatId, `An error has ocurred: ${err}`);
  });

  let size = 0
  video.on('info', function(info) {
    size = info.size
    let output = path.join(config.storage.direcotry,'/', info._filename);
    video.pipe(fs.createWriteStream(output));
  });

  let pos = 0
  video.on('data', function data(chunk) {
    pos += chunk.length
    // `size` should not be 0 here.
    if (size) {
      let percent = (pos / size * 100).toFixed(2);
      process.stdout.cursorTo(0)
      process.stdout.clearLine(1)
      process.stdout.write(percent + '%')
    }
  })

  video.on('next', playlist);
}

bot.onText(/\/playlist (.+)/, (msg, link) => {
  playlist(link[1]);
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
