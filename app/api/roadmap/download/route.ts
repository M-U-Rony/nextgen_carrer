import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import jsPDF from "jspdf";

/**
 * GET /api/roadmap/download
 * Download career roadmap as PDF
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    // Fetch user with roadmap
    const dbUser = await User.findById(user.userId).select("-password");
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow job seekers to download roadmaps
    if (dbUser.userType !== "job_seeker") {
      return NextResponse.json(
        { error: "Career roadmap is only available for job seekers" },
        { status: 403 }
      );
    }

    // Check if roadmap exists
    if (!dbUser.roadmap || dbUser.roadmap.trim() === "") {
      return NextResponse.json(
        { error: "No roadmap found. Please generate a roadmap first." },
        { status: 404 }
      );
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to split text into lines that fit the page width
    const splitText = (text: string, fontSize: number, maxWidth: number): string[] => {
      pdf.setFontSize(fontSize);
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = pdf.getTextWidth(testLine);

        if (textWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };

    // Header Section
    pdf.setFillColor(37, 99, 235); // Blue color
    pdf.rect(0, 0, pageWidth, 40, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("Career Roadmap", margin, 20);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated for: ${dbUser.name || "User"}`, margin, 30);
    
    const generatedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    pdf.text(`Generated on: ${generatedDate}`, margin, 36);

    yPosition = 50;

    // Parse and format roadmap content
    const roadmapText = dbUser.roadmap;
    const lines = roadmapText.split("\n");

    pdf.setTextColor(0, 0, 0); // Black text

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (line === "") {
        yPosition += 5;
        checkPageBreak(5);
        continue;
      }

      // Handle headers
      if (line.startsWith("# ")) {
        // Main heading
        checkPageBreak(15);
        yPosition += 10;
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(37, 99, 235);
        const headingText = line.substring(2).trim();
        const headingLines = splitText(headingText, 18, maxWidth);
        for (const headingLine of headingLines) {
          checkPageBreak(10);
          pdf.text(headingLine, margin, yPosition);
          yPosition += 8;
        }
        yPosition += 3;
      } else if (line.startsWith("## ")) {
        // Subheading
        checkPageBreak(12);
        yPosition += 8;
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(59, 130, 246);
        const subheadingText = line.substring(3).trim();
        const subheadingLines = splitText(subheadingText, 14, maxWidth);
        for (const subheadingLine of subheadingLines) {
          checkPageBreak(8);
          pdf.text(subheadingLine, margin, yPosition);
          yPosition += 7;
        }
        yPosition += 2;
      } else if (line.startsWith("### ")) {
        // Sub-subheading
        checkPageBreak(10);
        yPosition += 6;
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(96, 165, 250);
        const subSubheadingText = line.substring(4).trim();
        const subSubheadingLines = splitText(subSubheadingText, 12, maxWidth);
        for (const subSubheadingLine of subSubheadingLines) {
          checkPageBreak(7);
          pdf.text(subSubheadingLine, margin, yPosition);
          yPosition += 6;
        }
        yPosition += 2;
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        // List item
        checkPageBreak(8);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        const listItemText = line.substring(2).trim();
        const listItemLines = splitText(`• ${listItemText}`, 10, maxWidth - 5);
        for (const listItemLine of listItemLines) {
          checkPageBreak(6);
          pdf.text(listItemLine, margin + 5, yPosition);
          yPosition += 5;
        }
        yPosition += 2;
      } else {
        // Regular paragraph
        checkPageBreak(8);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        const paragraphLines = splitText(line, 10, maxWidth);
        for (const paragraphLine of paragraphLines) {
          checkPageBreak(6);
          pdf.text(paragraphLine, margin, yPosition);
          yPosition += 5;
        }
        yPosition += 2;
      }
    }

    // Footer on each page
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="career-roadmap-${dbUser.name?.replace(/\s+/g, "-") || "user"}-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}

