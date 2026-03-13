import { ElementType } from "react";
import { Code2, MonitorPlay, Database, Layout, Users, BrainCircuit } from "lucide-react";

export interface MockInterviewConfig {
    id: string;
    title: string;
    category: string;
    difficulty: "Easy" | "Medium" | "Hard" | "Expert";
    duration: string;
    description: string;
    icon: ElementType;
    color: string;
    bgUrl: string;
}

export const MOCK_INTERVIEWS: MockInterviewConfig[] = [
    {
        id: "javascript",
        title: "JavaScript Engineer",
        category: "Frontend Development",
        difficulty: "Medium",
        duration: "45 mins",
        description: "Practice core JavaScript concepts including closures, prototypes, event loop, and asynchronous programming.",
        icon: MonitorPlay,
        color: "text-yellow-400",
        bgUrl: "bg-yellow-400/10",
    },
    {
        id: "react",
        title: "React Frontend Developer",
        category: "Frontend Development",
        difficulty: "Medium",
        duration: "45 mins",
        description: "Targeted specifically at React patterns. Covers Hooks, state management, component lifecycle, Next.js, and rendering.",
        icon: Layout,
        color: "text-cyan-400",
        bgUrl: "bg-cyan-400/10",
    },
    {
        id: "html",
        title: "HTML5 Structure",
        category: "Web Fundamentals",
        difficulty: "Easy",
        duration: "30 mins",
        description: "Focuses on semantic HTML, accessibility, SEO best practices, and DOM node architecture.",
        icon: Database,
        color: "text-orange-400",
        bgUrl: "bg-orange-400/10",
    },
    {
        id: "css",
        title: "CSS Styling & Layouts",
        category: "Web Fundamentals",
        difficulty: "Easy",
        duration: "30 mins",
        description: "Test your knowledge of Flexbox, CSS Grid, media queries, animations, and modern CSS frameworks like Tailwind.",
        icon: Layout,
        color: "text-blue-400",
        bgUrl: "bg-blue-400/10",
    },
    {
        id: "python",
        title: "Python Developer",
        category: "Backend Development",
        difficulty: "Medium",
        duration: "45 mins",
        description: "Focuses on advanced language features, data structures, generators, list comprehensions, and Pythonic patterns.",
        icon: Code2,
        color: "text-green-400",
        bgUrl: "bg-green-400/10",
    }
];
