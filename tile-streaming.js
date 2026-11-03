// Stash Tile: 流媒体/AI 解锁面板
// 检测 YouTube、Netflix、ChatGPT 在当前出口下的可用性

var results = {}
var pending = 3

function done() {
  pending--
  if (pending > 0) return
  $done({
    title: '解锁检测',
    content: 'YouTube: ' + results.youtube + '\nNetflix: ' + results.netflix + '\nChatGPT: ' + results.chatgpt,
    icon: 'play.tv.fill',
    backgroundColor: '#663399'
  })
}

// YouTube: 解析地区代码
$httpClient.get(
  { url: 'https://www.youtube.com/premium', timeout: 8, headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' } },
  function (error, response, data) {
    if (error) results.youtube = '检测失败'
    else if (data && data.indexOf('Premium is not available in your country') !== -1) results.youtube = '不支持'
    else {
      var m = (data || '').match(/"GL":"([A-Z]{2})"/)
      results.youtube = m ? '支持 (' + m[1] + ')' : '支持'
    }
    done()
  }
)

// Netflix: 用非自制剧片源判断
$httpClient.get(
  { url: 'https://www.netflix.com/title/80018499', timeout: 8, headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' } },
  function (error, response, data) {
    if (error) results.netflix = '检测失败'
    else {
      var code = response ? response.status : 0
      if (code === 200 || code === 301 || code === 302) results.netflix = '完整解锁'
      else if (code === 404) results.netflix = '仅自制剧'
      else if (code === 403) results.netflix = '不支持'
      else results.netflix = '未知 (' + code + ')'
    }
    done()
  }
)

// ChatGPT: Cloudflare trace 判断出口地区是否在封锁名单
var GPT_BLOCKED = ['CN', 'HK', 'MO', 'RU', 'IR', 'KP', 'CU', 'SY', 'AF', 'BY', 'VE', 'MM']
$httpClient.get({ url: 'https://chatgpt.com/cdn-cgi/trace', timeout: 8 }, function (error, response, data) {
  if (error) results.chatgpt = '检测失败'
  else {
    var m = (data || '').match(/loc=([A-Z]{2})/)
    if (!m) results.chatgpt = '未知'
    else results.chatgpt = GPT_BLOCKED.indexOf(m[1]) !== -1 ? '不支持 (' + m[1] + ')' : '支持 (' + m[1] + ')'
  }
  done()
})
