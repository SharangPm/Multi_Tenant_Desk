import mongoose from 'mongoose';
export default async function connectDB() {
  if (!process.env.MONGO_URI)
    return console.warn('MONGO_URI not set; API starts without database');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
}
