import mongoose, { Schema, type Model } from "mongoose";

export type WidgetPingDocument = mongoose.Document & {
  projectId: string;
  siteOrigin: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const WidgetPingSchema = new Schema<WidgetPingDocument>(
  {
    projectId: { type: String, required: true, index: true },
    siteOrigin: { type: String, required: true },
    lastSeenAt: { type: Date, required: true },
  },
  { timestamps: true }
);

WidgetPingSchema.index({ projectId: 1, siteOrigin: 1 }, { unique: true });

const WidgetPingModel =
  (mongoose.models.WidgetPing as Model<WidgetPingDocument>) ||
  mongoose.model<WidgetPingDocument>("WidgetPing", WidgetPingSchema);

export default WidgetPingModel;
