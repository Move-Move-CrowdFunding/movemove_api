import mongoose from 'mongoose'

const schema = {
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, '請輸入用戶id']
  },
  projectId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, '請輸入提案id']
  },
  content: {
    type: String,
    required: [true, '請輸入通知內容']
  },
  isRead: {
    type: Boolean,
    default: false
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

const Notification = mongoose.model('Notification', modelSchema)

export default Notification
