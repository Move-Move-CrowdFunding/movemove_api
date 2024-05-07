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
  versionKey: false
}

const modelSchema = new mongoose.Schema(schema, option)

const Notification = mongoose.model('Notification', modelSchema)

export default Notification
