import mongoose from 'mongoose';

/**
 * Connect to MongoDB using the MONGODB_URI environment variable.
 * Falls back to a local MongoDB instance if not set.
 */
export async function connectDatabase(): Promise<void> {
  const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/ratekit';

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}
