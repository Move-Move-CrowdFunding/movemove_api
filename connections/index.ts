import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({path: './.env'});


const connectDB = () => {
  if (!process.env.MONGODB_URL && !process.env.MONGODB_PASSWORD) {
    console.log('資料庫環境未建立');
    return
  }
  
  const DB = String(process.env.MONGODB_URL).replace(
    '<password>',
    String(process.env.MONGODB_PASSWORD)
  );
  mongoose.connect(DB).then(() => console.log('資料庫連接成功'));
}

export default connectDB