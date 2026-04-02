import HeroSection from "@/components/HeroSection";
import MenuCard from "@/components/MenuCard";
import RsvpSection from "@/components/RsvpSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <main className="max-w-xl mx-auto px-4 -mt-6 pb-16 space-y-6">
        <MenuCard />
        <RsvpSection />
      </main>
    </div>
  );
};

export default Index;
