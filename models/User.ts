import mongoose from 'mongoose'
import { IUser } from '../interface/user' // Add the missing import statement for the 'IUser' interface

const schema = {
  email: {
    type: String,
    required: [true, '請輸入Email']
  },
  password: {
    type: String,
    required: [true, '請輸入密碼']
  },
  auth: {
    type: Number,
    default: 0
  },
  nickName: {
    type: String,
    default: ''
  },
  userName: {
    type: String,
    default: ''
  },
  gender: {
    type: Number,
    default: 0
  },
  birth: {
    type: Number
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  teamName: {
    type: String,
    default: ''
  },
  aboutMe: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  createTime: {
    type: Number
  },
  updateTime: {
    type: Number
  }
}

const option = {
  versionKey: false,
  timestamps: {
    createdAt: 'createTime',
    updatedAt: 'updateTime',
    currentTime: () => Math.floor(Date.now() / 1000)
  },
  toJSON: {
    transform(doc: any, ret: any) {
      ret.id = ret._id
      delete ret._id
    }
  }
}

const modelSchema = new mongoose.Schema(schema, option)

const User = mongoose.model<IUser & mongoose.Document>('User', modelSchema)

export default User
