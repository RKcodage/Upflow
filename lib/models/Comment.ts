import mongoose, { Schema, type Model } from "mongoose";

export type CommentDocument = mongoose.Document & {
  projectId: string;
  featureId: string;
  authorId: string;
  authorEmail: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
};

const CommentSchema = new Schema<CommentDocument>(
  {
    projectId: { type: String, required: true, index: true },
    featureId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    authorEmail: { type: String, required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

CommentSchema.index({ featureId: 1, createdAt: -1 });

const CommentModel =
  (mongoose.models.Comment as Model<CommentDocument>) ||
  mongoose.model<CommentDocument>("Comment", CommentSchema);

export default CommentModel;
