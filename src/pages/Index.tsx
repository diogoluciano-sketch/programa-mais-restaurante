import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import MenuCard from "@/components/MenuCard";
import RsvpSection from "@/components/RsvpSection";
import ConfirmationCounter from "@/components/ConfirmationCounter";
import SatisfactionSurvey from "@/components/SatisfactionSurvey";

const Index = () => {
  const [confirmationCount, setConfirmationCount] = useState(12);

  const handleConfirm = () => {
    setConfirmationCount((prev) => prev + 1);
  };

  const handleCancel = () => {
    setConfirmationCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <main className="max-w-xl mx-auto px-4 -mt-6 pb-16 space-y-6">
        <ConfirmationCounter count={confirmationCount} />
        <MenuCard />
        <RsvpSection onConfirm={handleConfirm} onCancel={handleCancel} />
        <SatisfactionSurvey />
      </main>
    </div>
  );
};

export default Index;
