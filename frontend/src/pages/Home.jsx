import { lazy, Suspense } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

// Below-the-fold sections — code-split into separate chunks so the initial
// bundle only has to parse/execute Navbar + Hero before first paint; these
// chunks fetch in parallel right after and swap in via Suspense.
const Features = lazy(() => import("../components/Features"));
const Demo = lazy(() => import("../components/Demo"));
const About = lazy(() => import("../components/About"));
const Contact = lazy(() => import("../components/Contact"));
const Footer = lazy(() => import("../components/Footer"));

export default function Home() {
  return (
    <div className="font-sans bg-paper text-ink">
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={null}>
          <Features />
          <Demo />
          <About />
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
