import mongoose from 'mongoose';

const schema = {}

const option = {
  versionKey: false,
}

const  modelSchema = new mongoose.Schema(schema, option);

const Notification = mongoose.model('Notification', modelSchema);

export default Notification;
