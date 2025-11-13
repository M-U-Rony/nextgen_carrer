import connectDB from "../lib/mongodb";
import Resource from "../models/Resource";

const resources = [
  {
    title: "Complete React Developer Course",
    platform: "Udemy",
    url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux",
    relatedSkills: ["React", "JavaScript", "Redux", "Hooks"],
    cost: "Paid" as const,
    description: "Master React from scratch. Build real-world projects and learn modern React patterns.",
    duration: "40+ hours",
    level: "Beginner" as const,
    rating: 4.7,
  },
  {
    title: "JavaScript Fundamentals",
    platform: "freeCodeCamp",
    url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures",
    relatedSkills: ["JavaScript", "ES6", "Algorithms", "Data Structures"],
    cost: "Free" as const,
    description: "Learn JavaScript fundamentals through interactive coding challenges.",
    duration: "300+ hours",
    level: "Beginner" as const,
    rating: 4.9,
  },
  {
    title: "TypeScript for Beginners",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=BwuLxPH8IDs",
    relatedSkills: ["TypeScript", "JavaScript", "Programming"],
    cost: "Free" as const,
    description: "Complete TypeScript tutorial for beginners. Learn type safety and modern JavaScript features.",
    duration: "4 hours",
    level: "Beginner" as const,
    rating: 4.6,
  },
  {
    title: "Advanced React Patterns",
    platform: "Frontend Masters",
    url: "https://frontendmasters.com/courses/advanced-react-patterns",
    relatedSkills: ["React", "Hooks", "Performance", "Patterns"],
    cost: "Paid" as const,
    description: "Deep dive into advanced React patterns, performance optimization, and best practices.",
    duration: "8 hours",
    level: "Advanced" as const,
    rating: 4.8,
  },
  {
    title: "TailwindCSS Complete Guide",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=UBOj6rqRUME",
    relatedSkills: ["TailwindCSS", "CSS", "Web Design"],
    cost: "Free" as const,
    description: "Learn TailwindCSS from scratch. Build modern, responsive websites quickly.",
    duration: "6 hours",
    level: "Beginner" as const,
    rating: 4.7,
  },
  {
    title: "Next.js 14 Full Course",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=Sklc_fQBmcs",
    relatedSkills: ["Next.js", "React", "Server Components", "App Router"],
    cost: "Free" as const,
    description: "Complete Next.js 14 tutorial covering App Router, Server Components, and more.",
    duration: "10 hours",
    level: "Intermediate" as const,
    rating: 4.8,
  },
  {
    title: "Python for Data Science",
    platform: "Coursera",
    url: "https://www.coursera.org/specializations/python",
    relatedSkills: ["Python", "Data Science", "Pandas", "NumPy"],
    cost: "Paid" as const,
    description: "Learn Python programming for data analysis and visualization.",
    duration: "60+ hours",
    level: "Beginner" as const,
    rating: 4.6,
  },
  {
    title: "UI/UX Design Fundamentals",
    platform: "Coursera",
    url: "https://www.coursera.org/learn/ui-ux-design",
    relatedSkills: ["UI/UX", "Design", "Figma", "User Research"],
    cost: "Paid" as const,
    description: "Master the fundamentals of UI/UX design. Learn design thinking and prototyping.",
    duration: "50+ hours",
    level: "Beginner" as const,
    rating: 4.7,
  },
  {
    title: "MongoDB University",
    platform: "MongoDB",
    url: "https://university.mongodb.com",
    relatedSkills: ["MongoDB", "Database", "NoSQL", "Backend"],
    cost: "Free" as const,
    description: "Free MongoDB courses covering everything from basics to advanced topics.",
    duration: "Self-paced",
    level: "Beginner" as const,
    rating: 4.8,
  },
  {
    title: "Node.js Complete Course",
    platform: "Udemy",
    url: "https://www.udemy.com/course/nodejs-the-complete-guide",
    relatedSkills: ["Node.js", "Express", "Backend", "REST APIs"],
    cost: "Paid" as const,
    description: "Build scalable backend applications with Node.js and Express.",
    duration: "45+ hours",
    level: "Intermediate" as const,
    rating: 4.7,
  },
  {
    title: "HTML & CSS Crash Course",
    platform: "freeCodeCamp",
    url: "https://www.freecodecamp.org/learn/2022/responsive-web-design",
    relatedSkills: ["HTML", "CSS", "Responsive Design", "Web Development"],
    cost: "Free" as const,
    description: "Learn HTML and CSS through hands-on projects. Build responsive websites.",
    duration: "300+ hours",
    level: "Beginner" as const,
    rating: 4.9,
  },
  {
    title: "Git & GitHub Mastery",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=3RjQznt-8kE",
    relatedSkills: ["Git", "GitHub", "Version Control", "Collaboration"],
    cost: "Free" as const,
    description: "Master Git and GitHub for version control and collaboration.",
    duration: "3 hours",
    level: "Beginner" as const,
    rating: 4.7,
  },
  {
    title: "Figma Design Course",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=FTFaQWZBqQ8",
    relatedSkills: ["Figma", "Design", "UI/UX", "Prototyping"],
    cost: "Free" as const,
    description: "Complete Figma tutorial for UI/UX designers. Learn design tools and workflows.",
    duration: "5 hours",
    level: "Beginner" as const,
    rating: 4.6,
  },
  {
    title: "Machine Learning Basics",
    platform: "Coursera",
    url: "https://www.coursera.org/learn/machine-learning",
    relatedSkills: ["Machine Learning", "Python", "Data Science", "AI"],
    cost: "Paid" as const,
    description: "Introduction to machine learning algorithms and applications.",
    duration: "55+ hours",
    level: "Intermediate" as const,
    rating: 4.8,
  },
  {
    title: "Web Development Bootcamp",
    platform: "Udemy",
    url: "https://www.udemy.com/course/the-complete-web-development-bootcamp",
    relatedSkills: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    cost: "Paid" as const,
    description: "Complete web development bootcamp covering frontend and backend technologies.",
    duration: "60+ hours",
    level: "Beginner" as const,
    rating: 4.7,
  },
  {
    title: "Communication Skills Masterclass",
    platform: "Udemy",
    url: "https://www.udemy.com/course/communication-skills-masterclass",
    relatedSkills: ["Communication", "Soft Skills", "Presentation", "Leadership"],
    cost: "Paid" as const,
    description: "Improve your communication skills for professional success.",
    duration: "12 hours",
    level: "Beginner" as const,
    rating: 4.6,
  },
  {
    title: "Excel for Data Analysis",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=0nbkaYsR94c",
    relatedSkills: ["Excel", "Data Analysis", "Spreadsheets", "Business"],
    cost: "Free" as const,
    description: "Master Excel for data analysis, formulas, and business intelligence.",
    duration: "8 hours",
    level: "Beginner" as const,
    rating: 4.7,
  },
  {
    title: "Docker & Kubernetes",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=fqMOX6JJhGo",
    relatedSkills: ["Docker", "Kubernetes", "DevOps", "Containers"],
    cost: "Free" as const,
    description: "Learn containerization with Docker and orchestration with Kubernetes.",
    duration: "6 hours",
    level: "Intermediate" as const,
    rating: 4.7,
  },
  {
    title: "SQL for Beginners",
    platform: "freeCodeCamp",
    url: "https://www.freecodecamp.org/learn/relational-database",
    relatedSkills: ["SQL", "Database", "PostgreSQL", "Backend"],
    cost: "Free" as const,
    description: "Learn SQL and relational databases through interactive exercises.",
    duration: "300+ hours",
    level: "Beginner" as const,
    rating: 4.8,
  },
  {
    title: "Design Systems with TailwindCSS",
    platform: "Egghead",
    url: "https://egghead.io/courses/design-systems-with-tailwindcss",
    relatedSkills: ["TailwindCSS", "Design Systems", "CSS", "UI"],
    cost: "Paid" as const,
    description: "Build scalable design systems using TailwindCSS and modern CSS practices.",
    duration: "4 hours",
    level: "Intermediate" as const,
    rating: 4.7,
  },
  {
    title: "Scrimba - TypeScript Essentials",
    platform: "Scrimba",
    url: "https://scrimba.com/learn/typescript",
    relatedSkills: ["TypeScript", "JavaScript", "Programming"],
    cost: "Free" as const,
    description: "Interactive TypeScript course with hands-on coding exercises.",
    duration: "5 hours",
    level: "Beginner" as const,
    rating: 4.6,
  },
];

async function seedResources() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear existing resources (optional - remove if you want to keep existing data)
    await Resource.deleteMany({});
    console.log("Cleared existing resources");

    // Insert resources
    const insertedResources = await Resource.insertMany(resources);
    console.log(`Successfully seeded ${insertedResources.length} resources`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding resources:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedResources();
}

export default seedResources;

