import mongoose from 'mongoose'

const schema = {}

const option = {
  versionKey: false
}

const modelSchema = new mongoose.Schema(schema, option)

const Sponsor = mongoose.model('Sponsor', modelSchema)

export default Sponsor
