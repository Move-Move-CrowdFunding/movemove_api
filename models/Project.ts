import mongoose from 'mongoose';

const schema = {}

const option = {
  versionKey: false,
}

const  modelSchema = new mongoose.Schema(schema, option);

const Project = mongoose.model('Project', modelSchema);

export default Project;
