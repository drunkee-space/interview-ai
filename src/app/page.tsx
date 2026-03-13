import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Problem } from "@/components/problem";
import { Solution } from "@/components/solution";
import { Demo } from "@/components/demo";
import { HowItWorks } from "@/components/how-it-works";
import { Features } from "@/components/features";
import { FutureVision } from "@/components/future-vision";
import { Pricing } from "@/components/pricing";
import { Testimonials } from "@/components/testimonials";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full flex flex-col items-center">
        <Hero />
        <Problem />
        <Solution />
        <Demo />
        <HowItWorks />
        <Features />
        <FutureVision />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
