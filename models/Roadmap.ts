import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoadmap extends Document {
  userId: mongoose.Types.ObjectId;
  targetRole: string;
  timeline: string; // "3-month" | "6-month"
  dailyHours?: number;
  roadmapText: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapSchema = new Schema<IRoadmap>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    targetRole: {
      type: String,
      required: [true, "Target role is required"],
      trim: true,
    },
    timeline: {
      type: String,
      required: [true, "Timeline is required"],
      enum: ["3-month", "6-month"],
    },
    dailyHours: {
      type: Number,
      min: 0,
      max: 24,
    },
    roadmapText: {
      type: String,
      required: [true, "Roadmap text is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate roadmaps for same user/role/timeline
RoadmapSchema.index({ userId: 1, targetRole: 1, timeline: 1 }, { unique: false });

const Roadmap: Model<IRoadmap> =
  mongoose.models.Roadmap || mongoose.model<IRoadmap>("Roadmap", RoadmapSchema);

export default Roadmap;

