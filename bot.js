const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl');
const config = require('./config');
const { info } = require('console');
const { url } = require('inspector');

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
bot.onText(/\/link/, (msg, link) => {
    'use strict'
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Send link please.');
    bot.on('message', (link) => {
      if (link.entities[0].type === 'url'){
        bot.sendChatAction(chatId,"upload_video");
        youtubedl.exec(link.text,
          ['-x', '--audio-format', 'mp3', '--audio-quality=0', '-o', '%(title)s.%(ext)s'],
          {cwd: config.storage.direcotry},
          function(err, output) {
            if (err) throw err
            console.log(output.join('\n'));
            bot.sendMessage(chatId,'Download completed');
        });
      }else{
        bot.sendMessage(chatId, 'This is not a link.');
      } 
    });
});

bot.on('message', (msg) => {
  'use strict'
  const chatId = msg.chat.id;
  if (msg.entities[0].type === 'url') {
    const url = msg.text;
    bot.sendChatAction(chatId,"upload_video");
    youtubedl.exec(url,
      ['-x', '--audio-format', 'mp3', '--audio-quality=0', '-o', '%(title)s.%(ext)s'],
      {cwd: config.storage.direcotry},
      function(err, output) {
        if (err) throw err
        console.log(output.join('\n'));
        //bot.sendMessage(chatId,'Download completed');
        successMessaje(chatId,url);
    });
  }
});

function successMessaje(chatId,url){
  youtubedl.getInfo(url, [], function(err, info) {
    if (err) throw err
    let msg = `
      🎵${info.title}\n
🕔${info._duration_hms}  💾${formatBytes(info.filesize)}\n
🤠Download completed successfully🤠`;
    bot.sendMessage(chatId,msg);
  });
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatTime(timestamp){
  const hours = Math.floor(timestamp / 60 / 60);
  const minutes = Math.floor(timestamp / 60) - (hours * 60);
  const seconds = timestamp % 60;
  const formatted = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
  return formatted;
}

function playlist(url) {

  'use strict'
  const audio = youtubedl.exec(url,
    ['-x', '--audio-format', 'mp3', '--audio-quality=0'],
    {cwd: config.storage.direcotry},
    function(err, output) {
      if (err) throw err
      console.log(output.join('\n'));
      bot.sendMessage(chatId,'Download completed');
  });
  audio.on('next', playlist);
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
