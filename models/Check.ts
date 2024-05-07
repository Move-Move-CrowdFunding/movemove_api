import mongoose from 'mongoose'

const schema = {
  projectId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, '請輸入提案id']
  },
  content: {
    type: String
  },
  status: {
    type: Number,
    required: [true, '請輸入審核狀態'],
    enum: {
      values: [0, 1, -1],
      message: '審核狀態碼錯誤'
    }
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

const Check = mongoose.model('Check', modelSchema)

export default Check
