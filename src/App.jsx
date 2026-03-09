import { Routes, Route } from 'react-router-dom';
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
import ReviewPage from './components/ReviewPage';
import FeedbackPage from './components/FeedbackPage';
import AboutPage from './components/AboutPage';

function LandingPage() {
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}
