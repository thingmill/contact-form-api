const express = require('express')
const fs = require('fs')
const app = express()
const twig = require('twig')
const cors = require('cors')
const axios = require('axios')
const Ajv = require('ajv')
const localize = require('ajv-i18n')
const htmlToText = require('html-to-text')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const rateLimit = require("express-rate-limit")
const { I18n } = require('i18n')

dotenv.config()

const config = require('./config.json')

/**
 * I18N
 */
const i18n = new I18n({
  locales: ['en', 'fr'],
  objectNotation: true,
  directory: __dirname + '/i18n'
})

/**
 * Validation
 */
const validation = Ajv({ allErrors: true })
const schema = {
  properties: {
    name: { type: "string", maxLength: 255, minLength: 3 },
    email: { type: "string", maxLength: 255, minLength: 3, pattern: '[a-z0-9\._%+!$&*=^|~#%{}/\-]+@([a-z0-9\-]+\.){1,}([a-z]{2,22})' },
    subject: { type: "string", maxLength: 255, minLength: 3 },
    message: { type: "string", maxLength: 8000, minLength: 10 }
  },
  required: ['name', 'email', 'message']
}
const validate = validation.compile(schema)

/**
 * Rate limit
 */
const rateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    errors: [{ code: 'too-many-request', message: 'Too many requests' }]
  }
})

/**
 * Email transport
 */
let transporters = config.smtp.map(c => ({ transporter: nodemailer.createTransport(c), ...c }))

const viewPath = __dirname + '/views/'

let sendEmail = (transporterId, from, to, subject, templateName, templateParams) => {
  let smtpConfig = transporters.filter(t => t.id === transporterId)[0]

  const data = fs.readFileSync(viewPath + templateName + '.twig')
  const html = twig.twig({
    allowInlineIncludes: true,
    data: data.toString()
  }).render(templateParams)
  
  from = from + ' <' + smtpConfig.auth.user + '>'

  smtpConfig.transporter.sendMail({
    from,
    to, subject,
    text: htmlToText.fromString(html, { wordwrap: 130 }),
    html
  }).then(() => {
    console.log('> A ' + templateName + ' Email was sent to "' + to + '" via "' + from + '"')
  }).catch(err => {
    console.log('> Fail to send a ' + templateName + ' email to "' + to + '" via "' + from + '"')
    console.log(err)
  })
}

app.set('trust proxy', 1)
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  i18n.init(req, res)
  i18n.setLocale(req.getLocale())
  res.json({
    success: true,
    data: {
      locale: i18n.getLocale(),
      headers: req.headers,
      wow: req.getLocale()
    }
  })
})

app.post('/:id', rateLimiter, (req, res) => {
  let apps = config.apps.filter(a => a.id === req.params.id)
  if (apps.length === 0) {
    return res.status(400).json({
      success: false,
      errors: [{ code: 'invalid-app', message: 'Invalid Application id' }]
    })
  }
  let app = apps[0]
  if (Array.isArray(app.domains) && (req.headers.host == null || app.domains.filter(d => d === req.headers.host).length === 0)) {
    return res.status(400).json({
      success: false,
      errors: [{ code: 'forbidden-domain', message: 'Cannot send via this domain' }]
    })
  }

  if (req.body.locale != null) {
    i18n.setLocale(req.body.locale)
  } else {
    i18n.init(req, res)
    i18n.setLocale(req.getLocale())
  }
  
  console.log('> Using locale', i18n.getLocale())

  let valid = validate(req.body)
  if (!valid) {
    localize.fr(validate.errors)
    return res
      .status(400)
      .json({
        success: false,
        errors: validate.errors
      })
  }
  let timestamp = (new Date()).toISOString()

  res.json({ success: true })

  console.log("> New message:", {
    ...req.params,
    ...req.body
  })

  let fields = []

  if (req.body.subject != null) {
    fields.push({ name: 'Subject', value: req.body.subject, inline: true })
  }
  fields.push({ name: 'Name', value: req.body.name, inline: true })
  fields.push({ name: 'E-Mail', value: req.body.email })

  // post on discord
  if (app.discord != null) {
    axios.post(app.discord, {
      content: '',
      username: app.name + ' contact form',
      embeds: [
        {
          description: req.body.message,
          fields,
          timestamp,
          footer: {
            text: app.name + ' contact form'
          }
        }
      ]
    }).then((res) => {
      console.log(res.data)
    }).catch((err) => {
      console.log(err.response.data)
      console.log(err.response.code)
    })
  }

  // send email to admin
  if (app.email != null) {
    sendEmail(
      app.smtp,
      "Contact form",
      app.email,
      "New message on " + app.name,
      "admin",
      {
        ...req.body,
        date: timestamp
      }
    )
  }

  // send email to user
  if (req.body.confirm != null && req.body.confirm) {
    sendEmail(
      app.smtp,
      i18n.__('confirmation-email.from'),
      req.body.email,
      i18n.__('confirmation-email.subject'),
      "confirmation",
      {
        ...req.body,
        domain: req.headers.host,
        i18n
      }
    ) 
  }
})

const port = process.env.PORT || 3023
const host = process.env.HOST || '0.0.0.0'

app.listen(port, host, () => {
  console.log('> Listening on http://' + host + ':' + port)
})