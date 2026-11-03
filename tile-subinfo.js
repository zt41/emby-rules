// Stash Tile: 机场流量面板
// 用法：添加面板时，把机场订阅链接填入「参数(argument)」
// 多个机场用英文逗号分隔，例如: https://sub1...,https://sub2...
// 注意：订阅链接不要写进任何公开文件，只填在本地面板参数里

function fmtGB(bytes) {
  return (bytes / 1073741824).toFixed(1)
}

function parseUserinfo(headers) {
  var key = Object.keys(headers || {}).find(function (k) {
    return k.toLowerCase() === 'subscription-userinfo'
  })
  if (!key) return null
  var info = {}
  headers[key].split(';').forEach(function (pair) {
    var kv = pair.split('=')
    if (kv.length === 2) info[kv[0].trim()] = Number(kv[1].trim())
  })
  return info
}

function render(lines, hasError) {
  $done({
    title: '机场流量',
    content: lines.join('\n'),
    icon: 'gauge.with.dots.needle.67percent',
    backgroundColor: hasError ? '#CB1B45' : '#0E9F6E'
  })
}

var urls = ($argument || '').split(',').map(function (s) { return s.trim() }).filter(function (s) { return !!s })

if (urls.length === 0) {
  $done({
    title: '机场流量',
    content: '请在面板参数中填写订阅链接',
    icon: 'exclamationmark.triangle',
    backgroundColor: '#B45309'
  })
} else {
  var results = []
  var pending = urls.length
  var hasError = false

  urls.forEach(function (url, idx) {
    $httpClient.get({ url: url, timeout: 10 }, function (error, response, data) {
      var label = urls.length > 1 ? '机场' + (idx + 1) : ''
      if (error) {
        hasError = true
        results[idx] = (label ? label + ' ' : '') + '获取失败'
      } else {
        var info = parseUserinfo(response.headers)
        if (!info || !info.total) {
          hasError = true
          results[idx] = (label ? label + ' ' : '') + '无流量信息'
        } else {
          var used = (info.upload || 0) + (info.download || 0)
          var remain = info.total - used
          var pct = Math.round(used / info.total * 100)
          var line = (label ? label + ' ' : '') + '已用 ' + fmtGB(used) + 'G / ' + fmtGB(info.total) + 'G (' + pct + '%)\n剩余 ' + fmtGB(remain) + 'G'
          if (info.expire) {
            var days = Math.ceil((info.expire * 1000 - Date.now()) / 86400000)
            line += '，' + (days > 0 ? '剩余 ' + days + ' 天' : '已过期')
          }
          results[idx] = line
        }
      }
      pending--
      if (pending === 0) render(results, hasError)
    })
  })
}
