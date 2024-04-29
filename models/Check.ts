import mongoose from 'mongoose'

const schema = {}

const option = {
  versionKey: false
}

const modelSchema = new mongoose.Schema(schema, option)

const Check = mongoose.model('Check', modelSchema)

export default Check
