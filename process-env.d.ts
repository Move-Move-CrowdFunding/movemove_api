declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
      PORT: string;
      MONGODB_URL: string;
      MONGODB_PASSWORD: string;
      // add more environment variables and their types here
    }
  }
}