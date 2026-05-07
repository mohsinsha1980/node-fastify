import mongoose from "mongoose";

export interface IUser {
  email: string;
  password: string;
  refreshToken?: string;
  refreshTokenVersion?: number;
}

export interface IUserDocument extends mongoose.Document, IUser {}

const userSchema = new mongoose.Schema<IUserDocument>(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUserDocument>("User", userSchema);
