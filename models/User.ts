import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: Date;
  skills?: string[];
  preferredTrack?: string;
  education?: string;
  experienceLevel?: string;
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
  },
  {
    timestamps: true,
  }
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;

