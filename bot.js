const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl');
const config = require('./config');
const { info } = require('console');
const { url } = require('inspector');

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.bot.token, {polling: true});

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
