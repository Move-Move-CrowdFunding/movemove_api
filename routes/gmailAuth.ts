import express from 'express'

import { googleOAuth2Client } from '../utils/googleOAuth2Client'

const router = express.Router()

const SCOPES = ['https://mail.google.com/']

router.get('/login', (req, res) => {
  const authUrl = googleOAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  })
  res.redirect(authUrl)
})

router.get('/google/callback', async (req, res) => {
  const code = req.query.code?.toString() ?? ''
  try {
    const { tokens } = await googleOAuth2Client.getToken(code)

    googleOAuth2Client.setCredentials(tokens)
    ;(req.session as any).tokens = tokens

    res.redirect('/email/user')
  } catch (err) {
    console.error('Error authenticating with Google:', err)
    res.status(500).send('Error authenticating with Google')
  }
})

export default router
