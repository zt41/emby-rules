// Stash Tile: 网络状态面板 v2
// 显示当前出口 IP、归属地、运营商
// 主数据源 ip-api.com（中文），失败自动切换 ipwho.is（英文兜底）

function fail(msg) {
  $done({
    title: '网络状态',
    content: msg,
    icon: 'wifi.exclamationmark',
    backgroundColor: '#CB1B45'
  })
}

function render(location, ip, carrier) {
  $done({
    title: location,
    content: ip + '\n' + carrier,
    icon: 'globe.asia.australia.fill',
    backgroundColor: '#1F6FEB'
  })
}

function tryBackup() {
  $httpClient.get({ url: 'https://ipwho.is/', timeout: 8 }, function (error, response, data) {
    if (error) { fail('查询失败，请检查网络'); return }
    var info
    try { info = JSON.parse(data) } catch (e) { fail('数据解析失败'); return }
    if (!info || info.success !== true) { fail('查询失败'); return }
    var location = [info.country, info.region, info.city].filter(function (s) { return !!s }).join(' ')
    var conn = info.connection || {}
    var carrier = [conn.isp, conn.org].filter(function (s) { return !!s }).join(' / ')
    render(location, info.ip, carrier)
  })
}

$httpClient.get(
  { url: 'http://ip-api.com/json/?lang=zh-CN&fields=status,country,regionName,city,isp,org,query', timeout: 8 },
  function (error, response, data) {
    if (error) { tryBackup(); return }
    var info
    try { info = JSON.parse(data) } catch (e) { tryBackup(); return }
    if (!info || info.status !== 'success') { tryBackup(); return }
    var location = [info.country, info.regionName, info.city].filter(function (s) { return !!s }).join(' ')
    var carrier = [info.isp, info.org].filter(function (s) { return !!s }).join(' / ')
    render(location, info.query, carrier)
  }
)
