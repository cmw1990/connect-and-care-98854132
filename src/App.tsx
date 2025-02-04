import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import Index from "@/pages/Index";
import Groups from "@/pages/Groups";
import GroupDetails from "@/pages/GroupDetails";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { CareComparison } from "@/components/comparison/CareComparison";
import { CareGuides } from "@/pages/CareGuides";
import { Navbar } from "@/components/navigation/navbar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import { MoodSupport } from "@/pages/MoodSupport";
import More from "@/pages/More";
import "./App.css";

const AppContent = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const showNavbar = !location.pathname.includes('/auth');
  const isGroupsPage = location.pathname === '/groups';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showNavbar && !isMobile && !isGroupsPage && <Navbar />}
      <main className={cn(
        "flex-1 container mx-auto px-4 py-6",
        isMobile && "pb-20" // Extra padding for mobile navigation
      )}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId" element={<GroupDetails />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/compare" element={<CareComparison />} />
          <Route path="/care-guides" element={<CareGuides />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/mood-support" element={<MoodSupport />} />
          <Route path="/more" element={<More />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showNavbar && isMobile && <MobileNav />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;