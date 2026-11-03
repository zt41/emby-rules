// Stash Tile: Emby 服务器状态面板
// 默认从仓库拉取 Emby.list / EmbyDirect.list 域名逐个探测
// 也可以在面板参数(argument)中直接填域名，英文逗号分隔

var LIST_URLS = [
  'https://raw.githubusercontent.com/zt41/emby-rules/main/Emby.list',
  'https://raw.githubusercontent.com/zt41/emby-rules/main/EmbyDirect.list'
]

function finish(online, total, offlineList) {
  var offlineCount = total - online
  var content = '在线 ' + online + ' / ' + total
  if (offlineCount > 0) {
    var show = offlineList.slice(0, 5)
    content += '\n离线: ' + show.join('、')
    if (offlineCount > show.length) content += ' 等' + offlineCount + '个'
  }
  $done({
    title: 'Emby 服务器',
    content: content,
    icon: offlineCount === 0 ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill',
    backgroundColor: offlineCount === 0 ? '#0E9F6E' : (online === 0 ? '#CB1B45' : '#B45309')
  })
}

function probeAll(domains) {
  var online = 0
  var offline = []
  var pending = domains.length
  domains.forEach(function (domain) {
    $httpClient.get({ url: 'https://' + domain, timeout: 6 }, function (error, response, data) {
      if (!error && response) {
        online++
        done()
      } else {
        // https 不通再试 http
        $httpClient.get({ url: 'http://' + domain, timeout: 6 }, function (error2, response2, data2) {
          if (!error2 && response2) online++
          else offline.push(domain)
          done()
        })
      }
    })
  })
  function done() {
    pending--
    if (pending === 0) finish(online, domains.length, offline)
  }
}

function parseDomains(text) {
  var domains = []
  text.split('\n').forEach(function (line) {
    line = line.trim()
    if (line.indexOf('DOMAIN-SUFFIX,') === 0) {
      var d = line.split(',')[1]
      if (d) domains.push(d.trim())
    }
  })
  return domains
}

var argDomains = ($argument || '').split(',').map(function (s) { return s.trim() }).filter(function (s) { return !!s })

if (argDomains.length > 0) {
  probeAll(argDomains)
} else {
  var all = []
  var pendingLists = LIST_URLS.length
  var fetchFailed = false
  LIST_URLS.forEach(function (url) {
    $httpClient.get({ url: url, timeout: 10 }, function (error, response, data) {
      if (error) fetchFailed = true
      else all = all.concat(parseDomains(data || ''))
      pendingLists--
      if (pendingLists === 0) {
        if (all.length === 0) {
          $done({
            title: 'Emby 服务器',
            content: fetchFailed ? '域名列表拉取失败' : '未解析到域名',
            icon: 'exclamationmark.triangle',
            backgroundColor: '#CB1B45'
          })
        } else {
          // 去重
          var seen = {}
          var uniq = all.filter(function (d) {
            if (seen[d]) return false
            seen[d] = true
            return true
          })
          probeAll(uniq)
        }
      }
    })
  })
}
