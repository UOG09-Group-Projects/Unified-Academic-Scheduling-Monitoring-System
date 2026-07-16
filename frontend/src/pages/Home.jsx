import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Demo from "../components/Demo";
import About from "../components/About";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="font-sans bg-paper text-ink">
      <Navbar />
      <Hero />
      <Features />
      <Demo />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}
