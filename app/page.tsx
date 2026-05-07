import AOSProvider from "@/components/AOSProvider"
import Navbar from "@/components/Navbar"
import HeroSection from "@/components/hero/HeroSection"
import PhilosophySection from "@/components/PhilosophySection"
import CraftSection from "@/components/CraftSection"
import InnovationSection from "@/components/InnovationSection"
import PerspectiveMarqueeSection from "@/components/PerspectiveMarqueeSection"
import AppFeaturesScroll from "@/components/AppFeaturesScroll"
import ProductShowcase from "@/components/ProductShowcase"
import SocialWall from "@/components/SocialWall"
import BrandStatement from "@/components/BrandStatement"
import Newsletter from "@/components/Newsletter"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <AOSProvider>
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Navbar />
        <HeroSection />
        <PhilosophySection />
        <CraftSection />
        <InnovationSection />
        <PerspectiveMarqueeSection />
        <AppFeaturesScroll />
        <ProductShowcase />
        <SocialWall />
        <BrandStatement />
        <Newsletter />
        <Footer />
      </main>
    </AOSProvider>
  )
}
