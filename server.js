require('dotenv').config({ silent: true })

const fs = require('fs')
const path = require('path')
const express = require('express')
const ZipArchive = require('adm-zip')

const cors = require('cors')
const requestIp = require('request-ip')
const bodyParser = require('body-parser')
const { writeLog } = require('./utils/log')
const { timestamp } = require('./utils/timestamp')

const server = express()

server.use(cors())
server.use(requestIp.mw())
server.use(bodyParser.raw({ inflate: true }))
server.use(bodyParser.urlencoded({ extended: true }))

server.get('/get_timestamp', function (req, res) {
  return res
    .status(200)
    .header({ 'Content-type': 'text/plain' })
    .send(timestamp())
    .end()
})

server.post('/write_logfile', function (req, res) {
  writeLog(req.clientIp, req.body.toString())
  return res
    .status(200)
    .header({ 'Content-type': 'text/xml' })
    .send('<nop/>')
    .end()
})

server.get('/fetch_image', function (req, res) {
  const { collection: collectionName } = req.query

  const collectionPath = [
    process.env.LM_HOME,
    'annotationCache',
    'DirLists',
    [collectionName, '.txt'].join(''),
  ].join('/')

  const collections = fs
    .readFileSync(collectionPath, { encoding: 'utf-8' })
    .toString()
    .split('\n')

  const [folder, filename] = collections[
    Math.floor(Math.random() * collections.length)
  ].split(',')

  return res
    .status(200)
    .header({ 'Content-type': 'text/xml' })
    .send(`<out><dir>${folder}</dir><file>${filename}</file></out>`)
    .end()
})

server.get('/getpackfile', function (req, res) {
  const { folder, name: imname } = req.query

  let zip = new ZipArchive()

  let filename = imname.toString().split('.')
  filename.pop()
  filename = filename.join('.')

  // add image
  zip.addLocalFile(
    [process.env.LM_HOME, 'Images', folder, imname].join('/'),
    '',
    imname
  )

  // add image xml
  const xmlname = [filename, 'xml'].join('.')
  zip.addLocalFile(
    [process.env.LM_HOME, 'Annotations', folder, xmlname].join('/'),
    '',
    xmlname
  )

  // add image masks
  zip.addLocalFolder(
    [process.env.LM_HOME, 'Masks', folder].join('/'),
    'Masks/',
    (name) => path.basename(name).startsWith(filename + '_mask_')
  )

  // add image scribbles
  zip.addLocalFolder(
    [process.env.LM_HOME, 'Scribbles', folder].join('/'),
    'Scribbles/',
    (name) => path.basename(name).startsWith(filename + '_scribble_')
  )

  const zipPath = path.resolve(
    __dirname,
    '/tmp/' + new Date().getTime().toString() + '.zip'
  )

  zip.writeZip(zipPath)
  res.download(zipPath)
})

const PORT = process.env.PORT || 3000
server.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}`)
})
