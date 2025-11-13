import connectDB from "../lib/mongodb";
import Job from "../models/Job";

const jobs = [
  {
    title: "Frontend Developer Intern",
    company: "TechNova Labs",
    location: "Remote",
    requiredSkills: ["React", "TypeScript", "CSS", "HTML", "JavaScript"],
    experienceLevel: "Fresher" as const,
    jobType: "Internship" as const,
    track: "Web Development",
    description: "Join our dynamic team as a Frontend Developer Intern. You'll work on building responsive web applications using React and TypeScript. This is a great opportunity to learn from experienced developers and contribute to real-world projects.",
    salary: "Stipend: $500-800/month",
    applicationLink: "https://technova-labs.com/careers",
  },
  {
    title: "Junior UI Engineer",
    company: "BrightSpark Studios",
    location: "Dhaka, Bangladesh",
    requiredSkills: ["JavaScript", "HTML", "TailwindCSS", "React", "Figma"],
    experienceLevel: "Junior" as const,
    jobType: "Full-time" as const,
    track: "Web Development",
    description: "We're looking for a creative Junior UI Engineer to design and implement beautiful user interfaces. You'll collaborate with our design team to bring mockups to life using modern web technologies.",
    salary: "BDT 30,000-45,000/month",
    applicationLink: "https://brightspark.com/jobs",
  },
  {
    title: "Associate Web Specialist",
    company: "FutureWorks",
    location: "Hybrid",
    requiredSkills: ["React", "Next.js", "TypeScript", "Node.js"],
    experienceLevel: "Junior" as const,
    jobType: "Full-time" as const,
    track: "Web Development",
    description: "As an Associate Web Specialist, you'll work on full-stack web applications using Next.js and React. This role offers excellent growth opportunities and mentorship from senior developers.",
    salary: "$800-1,200/month",
    applicationLink: "https://futureworks.io/careers",
  },
  {
    title: "React Developer Intern",
    company: "CodeCraft Solutions",
    location: "Remote",
    requiredSkills: ["React", "JavaScript", "CSS", "Git"],
    experienceLevel: "Fresher" as const,
    jobType: "Internship" as const,
    track: "Web Development",
    description: "Perfect for students looking to gain real-world experience. You'll work on React-based projects, learn best practices, and receive mentorship from industry professionals.",
    salary: "Stipend: $400-600/month",
    applicationLink: "https://codecraft.com/internships",
  },
  {
    title: "Frontend Developer (Part-time)",
    company: "StartupHub",
    location: "Remote",
    requiredSkills: ["Vue.js", "JavaScript", "CSS", "HTML"],
    experienceLevel: "Junior" as const,
    jobType: "Part-time" as const,
    track: "Web Development",
    description: "Flexible part-time position ideal for students. Work 20 hours per week on exciting startup projects. Great work-life balance and remote-friendly environment.",
    salary: "$15-20/hour",
    applicationLink: "https://startuphub.com/jobs",
  },
  {
    title: "Web Design Intern",
    company: "Creative Minds Agency",
    location: "Remote",
    requiredSkills: ["HTML", "CSS", "JavaScript", "Figma", "Adobe XD"],
    experienceLevel: "Fresher" as const,
    jobType: "Internship" as const,
    track: "Design",
    description: "Combine your design skills with web development. Create beautiful, functional websites and learn from experienced designers and developers.",
    salary: "Stipend: $350-550/month",
    applicationLink: "https://creativeminds.com/internships",
  },
  {
    title: "Junior Data Analyst",
    company: "DataInsights Inc",
    location: "Remote",
    requiredSkills: ["Python", "SQL", "Excel", "Data Visualization"],
    experienceLevel: "Fresher" as const,
    jobType: "Full-time" as const,
    track: "Data",
    description: "Entry-level position for data enthusiasts. Analyze datasets, create reports, and help drive data-driven decisions. Training provided for the right candidate.",
    salary: "$600-900/month",
    applicationLink: "https://datainsights.com/careers",
  },
  {
    title: "Python Developer Intern",
    company: "PyTech Solutions",
    location: "Remote",
    requiredSkills: ["Python", "Django", "SQL", "Git"],
    experienceLevel: "Fresher" as const,
    jobType: "Internship" as const,
    track: "Web Development",
    description: "Learn backend development with Python and Django. Work on real projects and build your portfolio. Mentorship and learning resources provided.",
    salary: "Stipend: $450-700/month",
    applicationLink: "https://pytech.com/internships",
  },
  {
    title: "UI/UX Designer (Freelance)",
    company: "DesignStudio Pro",
    location: "Remote",
    requiredSkills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
    experienceLevel: "Junior" as const,
    jobType: "Freelance" as const,
    track: "Design",
    description: "Work on diverse client projects as a freelance UI/UX designer. Flexible schedule, remote work, and competitive rates. Build your portfolio with real projects.",
    salary: "$20-35/hour",
    applicationLink: "https://designstudio.com/freelance",
  },
  {
    title: "Full Stack Developer (Junior)",
    company: "WebCraft Digital",
    location: "Hybrid",
    requiredSkills: ["React", "Node.js", "MongoDB", "Express", "TypeScript"],
    experienceLevel: "Junior" as const,
    jobType: "Full-time" as const,
    track: "Web Development",
    description: "Join our growing team as a Junior Full Stack Developer. Work on both frontend and backend, learn modern technologies, and grow your career.",
    salary: "$1,000-1,500/month",
    applicationLink: "https://webcraft.com/jobs",
  },
  {
    title: "Content Writer (Part-time)",
    company: "TechBlog Media",
    location: "Remote",
    requiredSkills: ["Writing", "SEO", "Research", "WordPress"],
    experienceLevel: "Fresher" as const,
    jobType: "Part-time" as const,
    track: "Content",
    description: "Write engaging tech articles and blog posts. Perfect for students who love writing about technology. Flexible hours and remote work.",
    salary: "$10-15/hour",
    applicationLink: "https://techblog.com/writers",
  },
  {
    title: "JavaScript Developer Intern",
    company: "JS Masters",
    location: "Remote",
    requiredSkills: ["JavaScript", "React", "Node.js", "Git"],
    experienceLevel: "Fresher" as const,
    jobType: "Internship" as const,
    track: "Web Development",
    description: "Deep dive into JavaScript ecosystem. Work on modern web applications, learn industry best practices, and build your skills.",
    salary: "Stipend: $500-750/month",
    applicationLink: "https://jsmasters.com/internships",
  },
  {
    title: "Data Science Intern",
    company: "Analytics Pro",
    location: "Remote",
    requiredSkills: ["Python", "Pandas", "NumPy", "Machine Learning Basics"],
    experienceLevel: "Fresher" as const,
    jobType: "Internship" as const,
    track: "Data",
    description: "Learn data science fundamentals and work on real analytics projects. Great opportunity for students interested in data and machine learning.",
    salary: "Stipend: $550-800/month",
    applicationLink: "https://analyticspro.com/internships",
  },
  {
    title: "WordPress Developer (Freelance)",
    company: "WP Experts",
    location: "Remote",
    requiredSkills: ["WordPress", "PHP", "CSS", "JavaScript"],
    experienceLevel: "Junior" as const,
    jobType: "Freelance" as const,
    track: "Web Development",
    description: "Work on WordPress projects for various clients. Flexible schedule, remote work, and opportunity to build your freelance career.",
    salary: "$18-28/hour",
    applicationLink: "https://wpexperts.com/freelance",
  },
  {
    title: "Mobile App Developer Intern",
    company: "AppCraft Mobile",
    location: "Remote",
    requiredSkills: ["React Native", "JavaScript", "Mobile UI/UX"],
    experienceLevel: "Fresher" as const,
    jobType: "Internship" as const,
    track: "Mobile Development",
    description: "Build mobile applications using React Native. Learn mobile development best practices and contribute to real app projects.",
    salary: "Stipend: $500-700/month",
    applicationLink: "https://appcraft.com/internships",
  },
  {
    title: "Junior Backend Developer",
    company: "ServerStack Solutions",
    location: "Remote",
    requiredSkills: ["Node.js", "Express", "MongoDB", "REST APIs"],
    experienceLevel: "Junior" as const,
    jobType: "Full-time" as const,
    track: "Web Development",
    description: "Develop robust backend systems and APIs. Work with modern technologies and learn from experienced backend engineers.",
    salary: "$900-1,300/month",
    applicationLink: "https://serverstack.com/jobs",
  },
  {
    title: "Graphic Designer (Part-time)",
    company: "Visual Studio Creative",
    location: "Remote",
    requiredSkills: ["Adobe Photoshop", "Illustrator", "Figma", "Design Principles"],
    experienceLevel: "Fresher" as const,
    jobType: "Part-time" as const,
    track: "Design",
    description: "Create visual designs for web and print. Perfect for creative students looking to build their design portfolio.",
    salary: "$12-18/hour",
    applicationLink: "https://visualstudio.com/jobs",
  },
  {
    title: "DevOps Intern",
    company: "CloudOps Technologies",
    location: "Remote",
    requiredSkills: ["Linux", "Docker", "Git", "CI/CD Basics"],
    experienceLevel: "Fresher" as const,
    jobType: "Internship" as const,
    track: "DevOps",
    description: "Learn DevOps practices and cloud technologies. Work with deployment pipelines and infrastructure automation.",
    salary: "Stipend: $600-850/month",
    applicationLink: "https://cloudops.com/internships",
  },
  {
    title: "QA Tester (Junior)",
    company: "Quality Assurance Pro",
    location: "Remote",
    requiredSkills: ["Testing", "Bug Tracking", "Manual Testing", "Basic Automation"],
    experienceLevel: "Fresher" as const,
    jobType: "Full-time" as const,
    track: "Quality Assurance",
    description: "Ensure software quality through comprehensive testing. Learn testing methodologies and work with development teams.",
    salary: "$700-1,000/month",
    applicationLink: "https://qa-pro.com/careers",
  },
];

async function seedJobs() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear existing jobs (optional - remove if you want to keep existing data)
    await Job.deleteMany({});
    console.log("Cleared existing jobs");

    // Insert jobs
    const insertedJobs = await Job.insertMany(jobs);
    console.log(`Successfully seeded ${insertedJobs.length} jobs`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding jobs:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedJobs();
}

export default seedJobs;

