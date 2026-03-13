import Link from "next/link";
import { Code2, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-secondary/20 border-t border-border pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center space-x-2 group mb-4">
                            <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <Code2 className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">Interview AI</span>
                        </Link>
                        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                            Building the future of interview preparation, where AI acts as your personal recruiter and mentor.
                        </p>
                        <div className="flex items-center space-x-4">
                            <Link href="#" className="p-2 bg-background rounded-full border border-border hover:border-primary transition-colors text-muted-foreground hover:text-foreground">
                                <Twitter className="w-4 h-4" />
                                <span className="sr-only">Twitter</span>
                            </Link>
                            <Link href="#" className="p-2 bg-background rounded-full border border-border hover:border-primary transition-colors text-muted-foreground hover:text-foreground">
                                <Github className="w-4 h-4" />
                                <span className="sr-only">GitHub</span>
                            </Link>
                            <Link href="#" className="p-2 bg-background rounded-full border border-border hover:border-primary transition-colors text-muted-foreground hover:text-foreground">
                                <Linkedin className="w-4 h-4" />
                                <span className="sr-only">LinkedIn</span>
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Product</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                            <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link></li>
                            <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                            <li><Link href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Resources</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Interview Guides</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Coding Challenges</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Legal</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-muted-foreground">
                    <p>© {currentYear} Interview AI. All rights reserved.</p>
                    <p className="flex items-center">
                        Designed with <span className="text-red-500 mx-1">♥</span> for developers.
                    </p>
                </div>
            </div>
        </footer>
    );
}
