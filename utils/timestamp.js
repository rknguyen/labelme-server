exports.timestamp = function () {
  const [d, m, y, t] = new Date(Date.now())
    .toUTCString()
    .split(',')[1]
    .trim()
    .split(' ')
  return [[d, m, y].join('-'), t].join(' ')
}
