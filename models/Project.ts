import mongoose from 'mongoose'

const schema = {
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, '請輸入用戶id'],
  },
  introduce: {
    type: String,
    default: '',
  },
  teamName: {
    type: String,
    required: [true, '請輸入提案人名稱/團隊名稱'],
  },
  email: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: [true, '請輸入提案標題'],
  },
  categoryKey: {
    type: String,
    required: [true, '請選擇提案分類'],
    enum: {
      values: ['1', '2', '3', '4', '5', '6'],
      message: '提案類型錯誤',
    },
  },
  targetMoney: {
    type: Number,
    required: [true, '請輸入提案目標'],
  },
  startDate: {
    type: Number,
    required: [true, '請輸入提案開始日期'],
  },
  endDate: {
    type: Number,
    required: [true, '請輸入提案截止日期'],
  },
  describe: {
    type: Number,
    required: [true, '請輸入提案簡介'],
  },
  coverUrl: {
    type: String,
    required: [true, '請選擇提案封面'],
  },
  content: {
    type: String,
    required: [true, '請輸入提案說明'],
  },
  videoUrl: {
    type: String,
    default: '',
  },
  relatedUrl: {
    type: String,
    default: '',
  },
  feedbackItem: {
    type: String,
    default: '',
  },
  feedbackUrl: {
    type: String,
    default: '',
  },
  feedbackMoney: {
    type: Number,
    default: '',
  },
  feedbackDate: {
    type: Number,
    default: '',
  },
  createTime: {
    type: Number,
  },
  updateTime: {
    type: Number,
  },
}

const option = {
  versionKey: false,
  timestamps: {
    createdAt: 'createTime',
    updatedAt: 'updateTime',
    currentTime: () => Math.floor(Date.now() / 1000),
  },
}

const modelSchema = new mongoose.Schema(schema, option)

const Project = mongoose.model('Project', modelSchema)

export default Project
