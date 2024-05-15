import { auth } from 'googleapis/build/src/apis/oauth2'

const googleOAuth2Client = new auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URL
)

async function getAccessToken() {
  return await googleOAuth2Client.getAccessToken()
}

export { googleOAuth2Client, getAccessToken }
