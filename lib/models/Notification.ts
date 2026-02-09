import mongoose, { Schema, type Model } from "mongoose";

export type NotificationDocument = mongoose.Document & {
  projectId: string;
  featureId: string;
  title: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const NotificationSchema = new Schema<NotificationDocument>(
  {
    projectId: { type: String, required: true, index: true },
    featureId: { type: String, required: true },
    title: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const NotificationModel =
  (mongoose.models.Notification as Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);

export default NotificationModel;
