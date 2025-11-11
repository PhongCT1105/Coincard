import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./context/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import CoinDetails from "./pages/CoinDetails";
import Strategy from "./pages/Strategy";
import LiveTrading from "./pages/LiveTrading";
import TransactionList from "./components/TransactionList";

const PrivateRoute = ({ children, path }: { children: React.ReactNode; path: string }) => {
  const { user } = useAuth();
  return (
    <Route path={path}>{user ? children : <Redirect to="/signin" />}</Route>
  );
};

const DashboardShell = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex h-screen w-screen bg-neutral-950 text-white overflow-hidden">
      <AppSidebar />
      <main className="flex-1 h-full overflow-auto">{children}</main>
    </div>
  </SidebarProvider>
);

export default function App() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/signin">{user ? <Redirect to="/" /> : <SignIn />}</Route>
      <Route path="/signup">{user ? <Redirect to="/" /> : <SignUp />}</Route>

      <PrivateRoute path="/">
        <DashboardShell>
          <Home />
        </DashboardShell>
      </PrivateRoute>

      <PrivateRoute path="/strategy">
        <DashboardShell>
          <Strategy />
        </DashboardShell>
      </PrivateRoute>

      <PrivateRoute path="/live">
        <DashboardShell>
          <LiveTrading />
        </DashboardShell>
      </PrivateRoute>

      <PrivateRoute path="/coin/:symbol">
        <DashboardShell>
          <CoinDetails />
        </DashboardShell>
      </PrivateRoute>

      <PrivateRoute path="/transactions">
        <DashboardShell>
          <TransactionList userId="U01"/>
        </DashboardShell>
      </PrivateRoute>

      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
