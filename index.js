const express = require('express')

const app = express()
const cors = require('cors')
const { body, validationResult } = require('express-validator');
const moment = require('moment')

const axios = require('axios')

const url = 'https://discord.com/api/webhooks/743040823880319029/vP1xr5o7UfvOPuD-2QqiDaTCCQsu_fHu3u_YfCYSSJelVvhaK3gzwy1gY8-y37aJ_RuD'

app.use(cors())

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ success: true })
})

app.post('/', [
  body('email').isEmail().isLength({ min: 4, max: 255 }),
  body('name').isLength({ min: 1, max: 255 }),
  body('message').isLength({ min: 1, max: 9990 })
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  console.log(req.body.name, req.body.email, req.body.message)

  axios.post(url, {
    content: '',
    username: 'Thingmill contact form',
    embeds: [
      {
        description: req.body.message,
        fields: [
          { name: 'Name', value: req.body.name },
          { name: 'E-Mail', value: req.body.email }
        ],
        timestamp: moment().toISOString()
      }
    ]
  }).then((res) => {
    console.log(res.data)
  }).catch((err) => {
    console.log(err)
  })

  res.json({ success: true })
})

const port = 3023
const host = '0.0.0.0'

app.listen(port, host, () => {
  console.log('Listening on http://' + host + ':' + port)
})