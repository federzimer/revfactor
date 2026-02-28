import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Pain from './components/Pain';
import Features from './components/Features';
import Philosophy from './components/Philosophy';
import Process from './components/Process';
import SocialProof from './components/SocialProof';
import Qualification from './components/Qualification';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Pain />
        <Features />
        <Philosophy />
        <Process />
        <SocialProof />
        <Qualification />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
