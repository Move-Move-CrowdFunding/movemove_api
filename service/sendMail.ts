import nodemailer from 'nodemailer'
import { googleOAuth2Client } from '../utils/googleOAuth2Client'

type MailOptions = {
  to: string
  subject: string
  text: string
}

export const sendMail = async ({ to, subject, text }: MailOptions) => {
  googleOAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  })

  const accessToken = await new Promise((resolve, reject) => {
    googleOAuth2Client.getAccessToken((err, token) => {
      if (err) {
        console.log('*ERR: ', err)
        reject(err)
      }
      resolve(token)
    })
  })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'movemovepm@gmail.com',
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken
    }
  } as nodemailer.TransportOptions)

  const mailOptions = {
    from: '"募募 MoveMove 集資平台" <movemovepm@gmail.com>',
    to, // 要寄送的對象
    subject, // '這是信件的主旨'
    text // '‘這是信件的內容'
  }

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(err)
      return err
      //   res.status(500).send('Error sending email')
    } else {
      console.log(info)
      return info
      //   res.send('Email sent')
    }
  })
}
