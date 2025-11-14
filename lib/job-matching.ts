/**
 * Job Matching Utility
 * Calculates match scores between user profile and job requirements
 */

import { IUser } from "@/models/User";
import { IJob } from "@/models/Job";

export interface MatchResult {
  matchScore: number; // 0-100
  matchPercentage: string; // "85%"
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: boolean;
  experienceMatchScore: number; // 0-100
  trackMatch: boolean;
  trackMatchScore: number; // 0-100
  skillMatchScore: number; // 0-100
  matchReasons: string[];
}

/**
 * Map experience levels for matching
 */
function mapExperienceLevel(level: string): string {
  const levelLower = level.toLowerCase();
  if (levelLower.includes("fresher") || levelLower.includes("entry") || levelLower.includes("intern")) {
    return "beginner";
  }
  if (levelLower.includes("junior") || levelLower.includes("mid")) {
    return "intermediate";
  }
  if (levelLower.includes("senior") || levelLower.includes("lead") || levelLower.includes("expert")) {
    return "advanced";
  }
  return levelLower;
}

/**
 * Calculate experience level match score
 */
function calculateExperienceMatch(
  userLevel: string | undefined,
  jobLevel: string
): { match: boolean; score: number } {
  if (!userLevel) {
    return { match: false, score: 0 };
  }

  const userMapped = mapExperienceLevel(userLevel);
  const jobMapped = mapExperienceLevel(jobLevel);

  // Exact match
  if (userMapped === jobMapped) {
    return { match: true, score: 100 };
  }

  // One level difference (e.g., Intermediate vs Senior)
  const levels = ["beginner", "intermediate", "advanced"];
  const userIndex = levels.indexOf(userMapped);
  const jobIndex = levels.indexOf(jobMapped);

  if (userIndex === -1 || jobIndex === -1) {
    return { match: false, score: 0 };
  }

  const difference = Math.abs(userIndex - jobIndex);
  if (difference === 1) {
    return { match: true, score: 50 }; // Partial match
  }

  return { match: false, score: 0 };
}

/**
 * Calculate skill match score
 */
function calculateSkillMatch(userSkills: string[], jobSkills: string[]): {
  matchedSkills: string[];
  missingSkills: string[];
  score: number;
} {
  if (jobSkills.length === 0) {
    return { matchedSkills: [], missingSkills: [], score: 0 };
  }

  const userSkillsLower = userSkills.map((s) => s.toLowerCase().trim());
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  jobSkills.forEach((jobSkill) => {
    const jobSkillLower = jobSkill.toLowerCase().trim();
    const isMatched = userSkillsLower.some((userSkill) => {
      return (
        userSkill === jobSkillLower ||
        userSkill.includes(jobSkillLower) ||
        jobSkillLower.includes(userSkill)
      );
    });

    if (isMatched) {
      // Find original casing from job skills
      const originalSkill = jobSkills.find(
        (s) => s.toLowerCase().trim() === jobSkillLower
      );
      if (originalSkill && !matchedSkills.includes(originalSkill)) {
        matchedSkills.push(originalSkill);
      }
    } else {
      // Find original casing from job skills
      const originalSkill = jobSkills.find(
        (s) => s.toLowerCase().trim() === jobSkillLower
      );
      if (originalSkill && !missingSkills.includes(originalSkill)) {
        missingSkills.push(originalSkill);
      }
    }
  });

  const score = (matchedSkills.length / jobSkills.length) * 100;

  return { matchedSkills, missingSkills, score };
}

/**
 * Calculate track match score
 */
function calculateTrackMatch(
  userTrack: string | undefined,
  jobTrack: string | undefined
): { match: boolean; score: number } {
  if (!userTrack || !jobTrack) {
    return { match: false, score: 0 };
  }

  const userTrackLower = userTrack.toLowerCase().trim();
  const jobTrackLower = jobTrack.toLowerCase().trim();

  if (userTrackLower === jobTrackLower) {
    return { match: true, score: 100 };
  }

  // Partial match (e.g., "Frontend Development" matches "Frontend")
  if (
    userTrackLower.includes(jobTrackLower) ||
    jobTrackLower.includes(userTrackLower)
  ) {
    return { match: true, score: 75 };
  }

  return { match: false, score: 0 };
}

/**
 * Calculate total match score between user and job
 * Formula: (Skill Match × 0.6) + (Experience Match × 0.2) + (Track Match × 0.2)
 */
export function calculateJobMatch(user: Partial<IUser>, job: IJob): MatchResult {
  const userSkills = (user.skills || []).filter((s) => s && s.trim() !== "");
  const jobSkills = job.requiredSkills || [];

  // Calculate individual match scores
  const skillMatch = calculateSkillMatch(userSkills, jobSkills);
  const experienceMatch = calculateExperienceMatch(
    user.experienceLevel,
    job.experienceLevel
  );
  const trackMatch = calculateTrackMatch(user.preferredTrack, job.track);

  // Calculate weighted total score
  const totalScore =
    skillMatch.score * 0.6 +
    experienceMatch.score * 0.2 +
    trackMatch.score * 0.2;

  // Generate match reasons
  const reasons: string[] = [];

  if (skillMatch.matchedSkills.length > 0) {
    if (skillMatch.matchedSkills.length === jobSkills.length) {
      reasons.push(`Matches all ${jobSkills.length} required skills`);
    } else {
      reasons.push(
        `Matches ${skillMatch.matchedSkills.length} out of ${jobSkills.length} required skills: ${skillMatch.matchedSkills.slice(0, 3).join(", ")}${skillMatch.matchedSkills.length > 3 ? "..." : ""}`
      );
    }
  }

  if (skillMatch.missingSkills.length > 0) {
    reasons.push(
      `Missing: ${skillMatch.missingSkills.slice(0, 3).join(", ")}${skillMatch.missingSkills.length > 3 ? ` and ${skillMatch.missingSkills.length - 3} more` : ""}`
    );
  }

  if (experienceMatch.match) {
    if (experienceMatch.score === 100) {
      reasons.push("Experience level aligned");
    } else {
      reasons.push("Experience level partially aligned");
    }
  } else {
    reasons.push("Experience level mismatch");
  }

  if (trackMatch.match) {
    reasons.push(`Fits your preferred track: ${user.preferredTrack}`);
  }

  return {
    matchScore: Math.round(totalScore),
    matchPercentage: `${Math.round(totalScore)}%`,
    matchedSkills: skillMatch.matchedSkills,
    missingSkills: skillMatch.missingSkills,
    experienceMatch: experienceMatch.match,
    experienceMatchScore: experienceMatch.score,
    trackMatch: trackMatch.match,
    trackMatchScore: trackMatch.score,
    skillMatchScore: skillMatch.score,
    matchReasons: reasons,
  };
}

