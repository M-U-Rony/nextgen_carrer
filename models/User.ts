import mongoose, { Schema, model, models } from "mongoose";

export interface IWorkExperience {
  jobTitle: string;
  company: string;
  startDate: string; // Format: "MMM YYYY" e.g., "Oct 2024"
  endDate?: string; // Optional, can be "Present" for current jobs
  description: string[]; // Array of bullet point descriptions
}

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: Date;
  userType: "job_seeker" | "employer";
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  // Job Seeker specific fields
  skills?: string[];
  preferredTrack?: string;
  education?: string;
  experienceLevel?: string;
  roadmap?: string; // AI-generated career roadmap
  cvSummary?: string; // AI-generated professional summary
  cvBullets?: string[]; // AI-generated CV bullet points
  projects?: string[]; // User's projects (for CV generation)
  workExperience?: IWorkExperience[]; // Work experience entries
  cvFile?: string; // Path to uploaded CV PDF file
  // Employer specific fields
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Don't return password by default
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    userType: {
      type: String,
      enum: ["job_seeker", "employer"],
      required: [true, "User type is required"],
      default: "job_seeker",
    },
    // Job Seeker specific fields
    skills: {
      type: [String],
      default: [],
    },
    preferredTrack: {
      type: String,
      trim: true,
    },
    education: {
      type: String,
      trim: true,
    },
    experienceLevel: {
      type: String,
      trim: true,
    },
    roadmap: {
      type: String,
      trim: true,
    },
    cvSummary: {
      type: String,
      trim: true,
    },
    cvBullets: {
      type: [String],
      default: [],
    },
    projects: {
      type: [String],
      default: [],
    },
    workExperience: {
      type: [
        {
          jobTitle: {
            type: String,
            required: true,
            trim: true,
          },
          company: {
            type: String,
            required: true,
            trim: true,
          },
          startDate: {
            type: String,
            required: true,
            trim: true,
          },
          endDate: {
            type: String,
            trim: true,
          },
          description: {
            type: [String],
            default: [],
          },
        },
      ],
      default: [],
    },
    cvFile: {
      type: String,
      trim: true,
    },
    // Employer specific fields
    companyName: {
      type: String,
      trim: true,
    },
    companyWebsite: {
      type: String,
      trim: true,
    },
    companyDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;

