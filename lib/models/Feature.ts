import mongoose, { Schema, type Model } from "mongoose";

export type FeatureStatus = "live" | "planned" | "in-progress" | "under-review";

export type FeatureDocument = mongoose.Document & {
  projectId: string;
  title: string;
  description: string;
  category: string;
  status: FeatureStatus;
  votes: number;
  upvoters: string[];
  createdAt: Date;
  updatedAt: Date;
};

const FeatureSchema = new Schema<FeatureDocument>(
  {
    projectId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ["live", "planned", "in-progress", "under-review"], default: "planned" },
    votes: { type: Number, default: 0 },
    upvoters: { type: [String], default: [] },
  },
  { timestamps: true }
);

const FeatureModel =
  (mongoose.models.Feature as Model<FeatureDocument>) ||
  mongoose.model<FeatureDocument>("Feature", FeatureSchema);

export default FeatureModel;
