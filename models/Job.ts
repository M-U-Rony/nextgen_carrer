import mongoose, { Schema, model, models } from "mongoose";

export interface IJob {
  _id?: string;
  title: string;
  company: string;
  location: string;
  requiredSkills: string[];
  experienceLevel: "Fresher" | "Junior" | "Mid";
  jobType: "Internship" | "Part-time" | "Full-time" | "Freelance";
  track: string;
  description: string;
  salary?: string;
  applicationLink?: string;
  postedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      required: true,
      default: [],
    },
    experienceLevel: {
      type: String,
      enum: ["Fresher", "Junior", "Mid"],
      required: [true, "Experience level is required"],
    },
    jobType: {
      type: String,
      enum: ["Internship", "Part-time", "Full-time", "Freelance"],
      required: [true, "Job type is required"],
    },
    track: {
      type: String,
      required: [true, "Track is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    salary: {
      type: String,
      trim: true,
    },
    applicationLink: {
      type: String,
      trim: true,
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Job = models.Job || model<IJob>("Job", JobSchema);

export default Job;

