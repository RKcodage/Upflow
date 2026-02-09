import mongoose, { Schema, type Model } from "mongoose";

export type UserDocument = mongoose.Document & {
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const UserModel =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", UserSchema);

export default UserModel;
