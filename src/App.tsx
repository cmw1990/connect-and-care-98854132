
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import Index from "@/pages/Index";
import Groups from "@/pages/Groups";
import GroupDetails from "@/pages/GroupDetails";
import { CreateGroup } from "@/pages/groups/CreateGroup";
import { JoinGroup } from "@/pages/groups/JoinGroup";
import Auth from "@/pages/Auth";
import Subscribe from "@/pages/Subscribe";
import NotFound from "@/pages/NotFound";
import { CareComparison } from "@/components/comparison/CareComparison";
import { CareGuides } from "@/pages/CareGuides";
import { Navbar } from "@/components/navigation/navbar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import { MoodSupport } from "@/pages/MoodSupport";
import More from "@/pages/More";
import Analytics from "@/pages/Analytics";
import Caregivers from "@/pages/Caregivers";
import Insurance from "@/pages/Insurance";
import Claims from "@/pages/insurance/Claims";
import Coverage from "@/pages/insurance/Coverage";
import Network from "@/pages/insurance/Network";
import Documents from "@/pages/insurance/Documents";
import InsuranceSetup from "@/pages/insurance/Setup";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import "./App.css";

const AppContent = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const showNavbar = !location.pathname.includes('/auth');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showNavbar && !isMobile && <Navbar />}
      {!location.pathname.includes('/auth') && <ThemeSwitcher />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex-1 container mx-auto px-4 py-6 space-y-6",
            isMobile && "pb-20" // Extra padding for mobile navigation
          )}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/create" element={<CreateGroup />} />
            <Route path="/groups/join" element={<JoinGroup />} />
            <Route path="/groups/:groupId" element={<GroupDetails />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/compare" element={<CareComparison />} />
            <Route path="/care-guides" element={<CareGuides />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/mood-support" element={<MoodSupport />} />
            <Route path="/more" element={<More />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/caregivers" element={<Caregivers />} />
            <Route path="/insurance" element={<Insurance />}>
              <Route index element={<Coverage />} />
              <Route path="claims" element={<Claims />} />
              <Route path="coverage" element={<Coverage />} />
              <Route path="network" element={<Network />} />
              <Route path="documents" element={<Documents />} />
              <Route path="setup" element={<InsuranceSetup />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      {showNavbar && isMobile && <MobileNav />}
    </div>
  );
};

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
