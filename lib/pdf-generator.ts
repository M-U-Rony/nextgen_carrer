import jsPDF from "jspdf";

interface CVData {
  name: string;
  email?: string;
  location?: string;
  phone?: string;
  linkedIn?: string;
  summary: string;
  skills: string[];
  workExperience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string[];
  }>;
  education?: string;
  projects?: string[];
  bullets?: string[]; // For CV builder format
}

interface PDFOptions {
  fontSize?: number;
  lineHeight?: number;
  margin?: number;
}

/**
 * Generate a professional CV as PDF
 */
export function generateCVPDF(
  cvData: CVData,
  options: PDFOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const fontSize = options.fontSize || 11;
  const lineHeight = options.lineHeight || 6;
  const margin = options.margin || 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with wrapping
  const addText = (text: string, size: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
    doc.setFontSize(size);
    if (isBold) {
      doc.setFont(undefined as any, "bold");
    } else {
      doc.setFont(undefined as any, "normal");
    }
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * (size * 0.35 + 2));
    
    lines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += size * 0.35 + 2;
    });
    
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined as any, "normal");
  };

  // Header Section
  doc.setFontSize(18);
  doc.setFont(undefined as any, "bold");
  doc.text(cvData.name, margin, yPos);
  yPos += 8;

  // Contact Information
  doc.setFontSize(9);
  doc.setFont(undefined as any, "normal");
  const contactInfo = [
    cvData.email,
    cvData.phone,
    cvData.location,
    cvData.linkedIn,
  ]
    .filter(Boolean)
    .join(" | ");
  
  if (contactInfo) {
    doc.text(contactInfo, margin, yPos);
    yPos += 6;
  }

  // Horizontal line
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Professional Summary
  if (cvData.summary) {
    doc.setFontSize(12);
    doc.setFont(undefined as any, "bold");
    doc.text("PROFESSIONAL SUMMARY", margin, yPos);
    yPos += 6;

    doc.setFontSize(fontSize);
    doc.setFont(undefined as any, "normal");
    addText(cvData.summary, fontSize);
    yPos += 5;
  }

  // Skills Section
  if (cvData.skills && cvData.skills.length > 0) {
    checkPageBreak(15);
    doc.setFontSize(12);
    doc.setFont(undefined as any, "bold");
    doc.text("SKILLS", margin, yPos);
    yPos += 6;

    doc.setFontSize(fontSize);
    doc.setFont(undefined as any, "normal");
    const skillsText = cvData.skills.join(" • ");
    addText(skillsText, fontSize);
    yPos += 5;
  }

  // Work Experience Section
  if (cvData.workExperience && cvData.workExperience.length > 0) {
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont(undefined as any, "bold");
    doc.text("WORK EXPERIENCE", margin, yPos);
    yPos += 8;

    cvData.workExperience.forEach((exp, index) => {
      if (index > 0) {
        checkPageBreak(20);
        yPos += 3; // Spacing between jobs
      }

      // Job Title and Company
      doc.setFontSize(fontSize + 1);
      doc.setFont(undefined as any, "bold");
      doc.text(exp.jobTitle, margin, yPos);
      
      const dateText = `${exp.startDate} - ${exp.endDate || "Present"}`;
      const dateWidth = doc.getTextWidth(dateText);
      doc.setFont(undefined as any, "normal");
      doc.text(dateText, pageWidth - margin - dateWidth, yPos);
      yPos += 4;

      // Company
      doc.setFontSize(fontSize);
      doc.setFont(undefined as any, "italic");
      doc.text(exp.company, margin, yPos);
      yPos += 5;

      // Description bullets
      if (exp.description && exp.description.length > 0) {
        exp.description.forEach((desc) => {
          checkPageBreak(8);
          doc.setFont(undefined as any, "normal");
          const bulletText = `• ${desc}`;
          const descLines = doc.splitTextToSize(bulletText, contentWidth - 5);
          descLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, margin + 5, yPos);
            yPos += lineHeight;
          });
        });
      }
      yPos += 2;
    });
  } else if (cvData.bullets && cvData.bullets.length > 0) {
    // Use bullets if no work experience (for CV builder format)
    checkPageBreak(15);
    doc.setFontSize(12);
    doc.setFont(undefined as any, "bold");
    doc.text("KEY ACHIEVEMENTS", margin, yPos);
    yPos += 8;

    doc.setFontSize(fontSize);
    doc.setFont(undefined as any, "normal");
    cvData.bullets.forEach((bullet) => {
      checkPageBreak(8);
      const bulletText = `• ${bullet}`;
      const bulletLines = doc.splitTextToSize(bulletText, contentWidth - 5);
      bulletLines.forEach((line: string) => {
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
    });
    yPos += 3;
  }

  // Education Section
  if (cvData.education) {
    checkPageBreak(15);
    doc.setFontSize(12);
    doc.setFont(undefined as any, "bold");
    doc.text("EDUCATION", margin, yPos);
    yPos += 6;

    doc.setFontSize(fontSize);
    doc.setFont(undefined as any, "normal");
    addText(cvData.education, fontSize);
    yPos += 5;
  }

  // Projects Section
  if (cvData.projects && cvData.projects.length > 0) {
    checkPageBreak(15);
    doc.setFontSize(12);
    doc.setFont(undefined as any, "bold");
    doc.text("PROJECTS", margin, yPos);
    yPos += 6;

    doc.setFontSize(fontSize);
    doc.setFont(undefined as any, "normal");
    cvData.projects.forEach((project) => {
      checkPageBreak(8);
      const projectLines = doc.splitTextToSize(`• ${project}`, contentWidth - 5);
      projectLines.forEach((line: string) => {
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
    });
  }

  return doc;
}

/**
 * Generate PDF from CV text (for job-specific CVs)
 */
export function generatePDFFromText(cvText: string, fileName?: string): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  const lines = cvText.split("\n");

  doc.setFontSize(11);
  lines.forEach((line) => {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - margin - 10) {
      doc.addPage();
      yPos = margin;
    }

    // Skip empty lines
    if (!line.trim()) {
      yPos += 5;
      return;
    }

    // Format section headers (ALL CAPS or bold)
    if (line.match(/^[A-Z][A-Z\s]+$/) || line.match(/^[A-Z][A-Z\s]+\|/)) {
      // Section header
      doc.setFontSize(12);
      doc.setFont(undefined as any, "bold");
      const headerText = line.replace(/\|.*$/, "").trim();
      doc.text(headerText, margin, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont(undefined as any, "normal");
    } else if (line.trim().startsWith("•")) {
      // Bullet point
      const wrappedLines = doc.splitTextToSize(line, contentWidth - 5);
      wrappedLines.forEach((wrappedLine: string) => {
        doc.text(wrappedLine, margin + 5, yPos);
        yPos += 5;
      });
    } else {
      // Regular text
      const wrappedLines = doc.splitTextToSize(line, contentWidth);
      wrappedLines.forEach((wrappedLine: string) => {
        // Bold for job titles or important info (lines with |)
        if (wrappedLine.includes("|")) {
          const parts = wrappedLine.split("|");
          doc.setFont(undefined as any, "bold");
          doc.text(parts[0].trim(), margin, yPos);
          if (parts[1]) {
            const normalWidth = doc.getTextWidth(parts[0].trim() + " | ");
            doc.setFont(undefined as any, "normal");
            doc.text(parts[1].trim(), margin + normalWidth, yPos);
          }
        } else {
          doc.setFont(undefined as any, "normal");
          doc.text(wrappedLine, margin, yPos);
        }
        yPos += 5;
      });
    }
  });

  return doc;
}

