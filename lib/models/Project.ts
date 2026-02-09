import mongoose, { Schema, type Model } from "mongoose";

export type ProjectDocument = mongoose.Document & {
  projectId: string;
  ownerId: string;
  name?: string;
  publicKey: string;
  allowedOrigins: string[];
  createdAt: Date;
  updatedAt: Date;
};

const ProjectSchema = new Schema<ProjectDocument>(
  {
    projectId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, default: "" },
    publicKey: { type: String, required: true },
    allowedOrigins: { type: [String], default: [] },
  },
  { timestamps: true }
);

const ProjectModel =
  (mongoose.models.Project as Model<ProjectDocument>) ||
  mongoose.model<ProjectDocument>("Project", ProjectSchema);

export default ProjectModel;
