const fs = require('fs');

function logToFile(message, type) {
  if(type === 'info'){
    console.log(message);
  }
  else{
    const logStream = fs.createWriteStream(`./logs/${type}.txt`, { flags: 'a' });
    logStream.write(`${message}\n\n`);
    logStream.end();
  }
}


const logger = {
  info: (message) => {
    let date = new Date();
    logToFile(`[INFO] ${date} ${message}`, 'log')
  },
  warn: (message) => {
    let date = new Date();
    logToFile(`[WARN] ${date} ${message}`, 'warn')
  },
  error: (message) => {
    let date = new Date();
    logToFile(`[ERROR] ${date} ${message}`, 'error')
  }
};

module.exports = logger;