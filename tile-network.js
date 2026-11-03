// Stash Tile: 网络状态面板
// 显示当前出口 IP、归属地、运营商
// 数据源: ip-api.com（免费，无需 Key）
const API = 'http://ip-api.com/json/?lang=zh-CN&fields=status,country,regionName,city,isp,org,query'

$httpClient.get(API, function (error, response, data) {
  if (error) {
    $done({
      title: '网络状态',
      content: '查询失败，请检查网络连接',
      icon: 'wifi.exclamationmark',
      backgroundColor: '#CB1B45',
    })
    return
  }
  let info
  try {
    info = JSON.parse(data)
  } catch (e) {
    $done({
      title: '网络状态',
      content: '数据解析失败',
      icon: 'wifi.exclamationmark',
      backgroundColor: '#CB1B45',
    })
    return
  }
  if (!info || info.status !== 'success') {
    $done({
      title: '网络状态',
      content: '查询失败，请稍后重试',
      icon: 'wifi.exclamationmark',
      backgroundColor: '#CB1B45',
    })
    return
  }
  const location = [info.country, info.regionName, info.city]
    .filter(function (s) { return s && s.length > 0 })
    .join(' ')
  const carrier = [info.isp, info.org]
    .filter(function (s, i, arr) { return s && s.length > 0 && arr.indexOf(s) === i })
    .join(' / ')
  $done({
    title: location,
    content: info.query + '\n' + carrier,
    icon: 'globe.asia.australia.fill',
    backgroundColor: '#1F6FEB',
  })
})
