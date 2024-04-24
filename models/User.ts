import mongoose from 'mongoose';

const schema = {}

const option = {
  versionKey: false,
}

const  modelSchema = new mongoose.Schema(schema, option);

const User = mongoose.model('User', modelSchema);

export default User;
