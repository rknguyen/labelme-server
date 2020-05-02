require('dotenv').config({ silent: true })

const fs = require('fs')
const { timestamp } = require('./timestamp')

exports.writeLog = function (addr, log) {
  return (
    fs.appendFileSync(
      `${process.env.LM_HOME}/annotationCache/Logs/logfile.txt`,
      [[timestamp(), addr, log].join(' '), '\n'].join('')
    ) && true
  )
}
