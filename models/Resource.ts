import mongoose, { Schema, model, models } from "mongoose";

export interface IResource {
  _id?: string;
  title: string;
  platform: string;
  url: string;
  relatedSkills: string[];
  cost: "Free" | "Paid";
  description?: string;
  duration?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  rating?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    platform: {
      type: String,
      required: [true, "Platform is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
    },
    relatedSkills: {
      type: [String],
      required: true,
      default: [],
    },
    cost: {
      type: String,
      enum: ["Free", "Paid"],
      required: [true, "Cost is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

const Resource = models.Resource || model<IResource>("Resource", ResourceSchema);

export default Resource;

