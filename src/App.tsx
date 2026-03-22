import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import MacEasterEgg from "@/components/MacEasterEgg";

// Public Pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Games from "@/pages/Games";
import Training from "@/pages/Training";
import Join from "@/pages/Join";
import Donate from "@/pages/Donate";
import Veterans from "@/pages/Veterans";
import MilsimRegistry from "@/pages/MilsimRegistry";
import MilsimGroup from "@/pages/MilsimGroup";
import MilsimRegister from "@/pages/MilsimRegister";
import MilsimManage from "@/pages/portal/MilsimManage";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import OpsCalendar from "@/pages/OpsCalendar";
import Forum from "@/pages/Forum";
import UserPublicProfile from "@/pages/UserPublicProfile";

// New Pages
import ServiceCard from "@/pages/portal/ServiceCard";
import Stats from "@/pages/Stats";

// Portal Pages
import Login from "@/pages/portal/Login";
import Register from "@/pages/portal/Register";
import Dashboard from "@/pages/portal/Dashboard";
import Inbox from "@/pages/portal/Inbox";
import Compose from "@/pages/portal/Compose";
import Apply from "@/pages/portal/Apply";
import ModPanel from "@/pages/portal/ModPanel";
import AdminPanel from "@/pages/portal/AdminPanel";
import CommandCenter from "@/pages/portal/CommandCenter";
import Friends from "@/pages/portal/Friends";
import SecurityProtocol from "@/pages/portal/SecurityProtocol";
import Profile from "@/pages/portal/Profile";
import ResetPassword from "@/pages/portal/ResetPassword";
import TwoFactorAuth from "@/pages/portal/TwoFactorAuth";
import Support from "@/pages/portal/Support";
import SupportAdmin from "@/pages/portal/SupportAdmin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/games" component={Games} />
      <Route path="/training" component={Training} />
      <Route path="/join" component={Join} />
      <Route path="/donate" component={Donate} />
      <Route path="/veterans" component={Veterans} />
      <Route path="/milsim" component={MilsimRegistry} />
      <Route path="/milsim/register" component={MilsimRegister} />
      <Route path="/milsim/:slug" component={MilsimGroup} />
      <Route path="/portal/milsim" component={MilsimManage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/ops" component={OpsCalendar} />
      <Route path="/forum" component={Forum} />
      <Route path="/u/:username" component={UserPublicProfile} />
      
      {/* Portal Routes */}
      <Route path="/portal/login" component={Login} />
      <Route path="/portal/register" component={Register} />
      <Route path="/portal/dashboard" component={Dashboard} />
      <Route path="/portal/inbox" component={Inbox} />
      <Route path="/portal/compose" component={Compose} />
      <Route path="/portal/apply" component={Apply} />
      <Route path="/portal/profile" component={Profile} />
      <Route path="/portal/mod" component={ModPanel} />
      <Route path="/portal/admin" component={AdminPanel} />
      <Route path="/portal/command" component={CommandCenter} />
      <Route path="/portal/friends" component={Friends} />
      <Route path="/portal/security" component={SecurityProtocol} />
      <Route path="/portal/reset-password" component={ResetPassword} />
      <Route path="/portal/2fa" component={TwoFactorAuth} />
      <Route path="/portal/service-card" component={ServiceCard} />
      <Route path="/portal/support" component={Support} />
      <Route path="/portal/support-admin" component={SupportAdmin} />
      <Route path="/stats" component={Stats} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <MacEasterEgg />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
