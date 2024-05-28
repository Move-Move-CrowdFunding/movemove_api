import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config({ path: './.env' })

const connectDB = () => {
  if (!process.env.MONGODB_URL && !process.env.MONGODB_PASSWORD) {
    console.log('資料庫環境未建立')
    return
  }

  // const DB = String(process.env.MONGODB_URL).replace('<password>', String(process.env.MONGODB_PASSWORD))
  // mongoose.connect(DB).then(() => console.log(`${process.env.MONGODB_URL} 連接成功`))
  
  
  const DB1 = "mongodb://localhost:27017/movemove"
  mongoose.connect(DB1).then(() => console.log('連接成功'))
}

export default connectDB
