declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined
      PORT: string
      MONGODB_URL: string
      MONGODB_PASSWORD: string
      SWAGGER_SCHEMES: string
      SWAGGER_HOST: string
      IMGUR_ALBUM_ID: string
      IMGUR_CLIENTID: string
      IMGUR_CLIENT_SECRET: string
      IMGUR_REFRESH_TOKEN: string
      // add more environment variables and their types here
    }
  }
}
