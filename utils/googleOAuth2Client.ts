import { google } from 'googleapis'

const googleOAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URL
)

async function getAccessToken() {
  return await googleOAuth2Client.getAccessToken()
}

export { googleOAuth2Client, getAccessToken }
