import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
import User from "@/models/User";
import { auth } from "@/auth";

// GET - Get a single job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const job = await Job.findById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

// PATCH - Update a job (employers only, only their own jobs)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is an employer
    const user = await User.findOne({ email: session.user.email });
    if (!user || user.userType !== "employer") {
      return NextResponse.json(
        { error: "Only employers can update jobs" },
        { status: 403 }
      );
    }

    const { id } = await params;
    // Check if job exists and belongs to this employer
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.employerId !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only update your own jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.requiredSkills !== undefined) {
      updateData.requiredSkills = Array.isArray(body.requiredSkills)
        ? body.requiredSkills
        : [body.requiredSkills];
    }
    if (body.experienceLevel !== undefined) {
      if (!["Fresher", "Junior", "Mid"].includes(body.experienceLevel)) {
        return NextResponse.json(
          { error: "Invalid experience level" },
          { status: 400 }
        );
      }
      updateData.experienceLevel = body.experienceLevel;
    }
    if (body.jobType !== undefined) {
      if (!["Internship", "Part-time", "Full-time", "Freelance"].includes(body.jobType)) {
        return NextResponse.json(
          { error: "Invalid job type" },
          { status: 400 }
        );
      }
      updateData.jobType = body.jobType;
    }
    if (body.track !== undefined) updateData.track = body.track;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.salary !== undefined) updateData.salary = body.salary;
    if (body.applicationLink !== undefined) updateData.applicationLink = body.applicationLink;

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      { message: "Job updated successfully", job: updatedJob },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a job (employers only, only their own jobs)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is an employer
    const user = await User.findOne({ email: session.user.email });
    if (!user || user.userType !== "employer") {
      return NextResponse.json(
        { error: "Only employers can delete jobs" },
        { status: 403 }
      );
    }

    const { id } = await params;
    // Check if job exists and belongs to this employer
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.employerId !== user._id.toString()) {
      return NextResponse.json(
        { error: "You can only delete your own jobs" },
        { status: 403 }
      );
    }

    await Job.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Job deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
