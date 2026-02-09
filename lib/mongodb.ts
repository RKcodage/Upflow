import mongoose from "mongoose";

const { MONGODB_URI } = process.env;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { mongoose?: MongooseCache };

const cached = globalForMongoose.mongoose ?? { conn: null, promise: null };

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment variables.");
  }
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  globalForMongoose.mongoose = cached;
  return cached.conn;
}
