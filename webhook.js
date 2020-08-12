const moment = require('moment')

const axios = require('axios')

const url = 'https://discord.com/api/webhooks/743040823880319029/vP1xr5o7UfvOPuD-2QqiDaTCCQsu_fHu3u_YfCYSSJelVvhaK3gzwy1gY8-y37aJ_RuD'

const sendWebhook = () => {
  axios.post(url, {
    content: 'hey jude',
    username: 'Thingmill contact form',
    embeds: [
      {
        description: 'WOW',
        timestamp: moment().toISOString()
      }
    ]
  }).then((res) => {
    console.log(res.data)
  }).catch((err) => {
    console.log(err)
  })
}
  
sendWebhook()