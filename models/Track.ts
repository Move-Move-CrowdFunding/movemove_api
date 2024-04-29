import mongoose from 'mongoose'

const schema = {}

const option = {
  versionKey: false
}

const modelSchema = new mongoose.Schema(schema, option)

const Track = mongoose.model('Track', modelSchema)

export default Track
