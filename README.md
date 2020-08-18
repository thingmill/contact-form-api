# Contact Form API

A self hosted way to host a contact form on your website. A simple server written with Node.js and Express.js.

## Features

- Validation
- Email notification
- Email confirmation (back to the sender)
- Discord webhook notification
- Rate limit
- Domain Whitelist (CORS support)
- Flexible JSON configuration
- I18n support (`fr` and `en`, add a new locale by creating a Pull Request!)

## Installation & Configuration

- Clone this repository
- We recommand the use of yarn v1
- Install the packages: `yarn install`
- Fill your `.env` (from `.env.example`) with the desired HOST and PORT env var
- Then, From the content of `config.example.json`, create your own `config.json`:
  - The `smtp` object contain all the SMTP configuration. *Every field is required*, [Using nodemailer under the hood](https://nodemailer.com/smtp/#general-options)
    - `id`: used to identify the config later in the `apps` object.
    - `host`: host to the SMTP server
    - `port`: port to the SMTP server
    - `secure`: *boolean*
    - `auth`:
      - `user`: The email address or username to identify with the SMTP server
      - `pass`: The password to authenticate with the SMTP server
  - The `apps` object contain all the applications
    - `id`: used to identify the app when posting a message. *Required, Cannot be null*
    - `name`: name that will show up in email and webhooks. *Required, Cannot be null*
    - `domains`: a array of all the allowed domains to post message for this app (verification via the 'Origin' header), if `null`, no domain verification will be conducted.
    - `smtp`: the ID of the SMTP config that will be used for this app. *Required, Cannot be null*
    - `discord`: the Discord Webhook URL to notify for a message on this app, if `null` no webhooks will be sent
    - `email`: the email address that will be used to notify the "administrator" of a new message, if `null` no notification will be sent to the administrator
- Finnaly, you can run the server using the `yarn start` command

## Usage

The server expose a HTTP server where you can make a Request (for example a AJAX request) via `POST /{id}` (where the id param id is the id of the application in the `config.json` file)

```java
> POST /{id} HTTP/1.1
> Host: yourdomain.fr
> Content-Type: application/json
> Accept-Language: fr

| {
| 	"name": "John Doe",
| 	"email": "youemail@example.com",
| 	"message": "Kasd eos consetetur invidunt dolores sea ipsum sea dolor kasd. Erat eirmod dolor consetetur voluptua, ipsum et accusam sadipscing sanctus et. Amet aliquyam diam sea eos ea amet nonumy ea lorem. No eos takimata nonumy justo diam tempor dolor rebum.",
| 	"subject": "Diam clita et et kasd.", // optional field
| 	"confirm": false // optional field, if true, will send a copy of this message back to the email given with the 'email' key
| 	"locale": "fr" // optional field, will force the locale, by default the locale is found using the Accept-Language header sent by the client
| }
```

This is pretty much it, the server will just respond back with a 200 code if everything is good and you will get your emails or webhook as planned. Other wise, you will get a 400 Bad Request error code indicating that the request has a issue.

## Contribution

Don't hesitate to give feedback, ask for help or ask question about this project by opening a issue.

Also, fell free to make a Pull Request or to ask for new features.

## To Do List, RoadMap

- Test and use in many projects
- `config.json` JSON Schema validation at startup
- Standard webhook support
- Slack support

## Credits

https://express-validator.github.io/docs/index.html

https://discord.com/developers/docs/resources/webhook

https://discord.com/developers/docs/resources/channel#embed-object-embed-field-structure

https://cdnjs.com/libraries/axios
