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
  money: {
    type: Number,
    required: [true, '請輸入贊助金額']
  },
  username: {
    type: String,
    required: [true, '請輸入贊助者名稱']
  },
  phone: {
    type: String,
    required: [true, '請輸入贊助者聯絡電話']
  },
  receiver: {
    type: String,
    required: [false, '請輸入收件人名稱']
  },
  receiverPhone: {
    type: String,
    required: [false, '請輸入收件人電話']
  },
  address: {
    type: String,
    required: [false, '請輸入收件地址']
  },
  isNeedFeedback: {
    type: Boolean,
    required: [true, '是否需要回饋品']
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
  }
}

const modelSchema = new mongoose.Schema(schema, option)

const Sponsor = mongoose.model('Sponsor', modelSchema)

export default Sponsor
