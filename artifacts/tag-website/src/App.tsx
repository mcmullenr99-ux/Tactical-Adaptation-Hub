import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthContext";

// Public Pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Games from "@/pages/Games";
import Training from "@/pages/Training";
import Join from "@/pages/Join";
import Donate from "@/pages/Donate";
import Veterans from "@/pages/Veterans";
import NotFound from "@/pages/not-found";

// Portal Pages
import Login from "@/pages/portal/Login";
import Register from "@/pages/portal/Register";
import Dashboard from "@/pages/portal/Dashboard";
import Inbox from "@/pages/portal/Inbox";
import Compose from "@/pages/portal/Compose";
import Apply from "@/pages/portal/Apply";
import ModPanel from "@/pages/portal/ModPanel";
import AdminPanel from "@/pages/portal/AdminPanel";

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
      
      {/* Portal Routes */}
      <Route path="/portal/login" component={Login} />
      <Route path="/portal/register" component={Register} />
      <Route path="/portal/dashboard" component={Dashboard} />
      <Route path="/portal/inbox" component={Inbox} />
      <Route path="/portal/compose" component={Compose} />
      <Route path="/portal/apply" component={Apply} />
      <Route path="/portal/mod" component={ModPanel} />
      <Route path="/portal/admin" component={AdminPanel} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
