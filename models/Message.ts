import mongoose, { Schema, model, models } from "mongoose";

export interface IMessage {
  _id?: string;
  userId: string;
  role: "user" | "assistant" | "system";
  text: string;
  conversationId?: string; // Optional: for grouping messages into conversations
  saved?: boolean; // Optional: mark conversation as saved
  createdAt?: Date;
  updatedAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true, // Index for faster queries
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: [true, "Role is required"],
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
    },
    conversationId: {
      type: String,
      trim: true,
      index: true,
    },
    saved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
MessageSchema.index({ userId: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, conversationId: 1, createdAt: -1 });

const Message = models.Message || model<IMessage>("Message", MessageSchema);

export default Message;

