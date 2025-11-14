import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

/**
 * POST /api/user/upload-cv
 * Upload a CV PDF file for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    // Fetch user to check user type
    const dbUser = await User.findById(user.userId);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow job seekers to upload CV
    if (dbUser.userType !== "job_seeker") {
      return NextResponse.json(
        { error: "CV upload is only available for job seekers" },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "cv");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedEmail = user.email?.replace(/[^a-zA-Z0-9]/g, "_") || "user";
    const filename = `cv_${sanitizedEmail}_${timestamp}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save file path to user profile
    const cvFileUrl = `/uploads/cv/${filename}`;
    dbUser.cvFile = cvFileUrl;
    await dbUser.save();

    return NextResponse.json(
      {
        success: true,
        message: "CV uploaded successfully",
        cvFile: cvFileUrl,
        user: dbUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading CV:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload CV",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/upload-cv
 * Delete the uploaded CV file
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    // Fetch user
    const dbUser = await User.findById(user.userId);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete file if it exists
    if (dbUser.cvFile) {
      const filepath = path.join(process.cwd(), "public", dbUser.cvFile);
      if (existsSync(filepath)) {
        const { unlink } = await import("fs/promises");
        await unlink(filepath);
      }
    }

    // Remove CV file reference from user profile
    dbUser.cvFile = undefined;
    await dbUser.save();

    return NextResponse.json(
      {
        success: true,
        message: "CV deleted successfully",
        user: dbUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting CV:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete CV",
      },
      { status: 500 }
    );
  }
}

