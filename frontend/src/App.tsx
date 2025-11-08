// import { SidebarProvider } from "@/components/ui/sidebar"
// import { AppSidebar } from "@/components/app-sidebar"
// import Home from "./pages/Home"
// import SignIn from "./pages/SignIn"
// import SignUp from "./pages/SignUp"
// import NotFound from "./pages/not-found"
// import { Switch, Route } from "wouter";
// import { Toaster } from "@/components/ui/toaster"
// import { queryClient } from "./lib/queryClient";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { TooltipProvider } from "@/components/ui/tooltip";

// function Router() {
//   return (
//     <Switch>
//       <Route path="/" component={Home} />
//       <Route path="/signin" component={SignIn} />
//       <Route path="/signup" component={SignUp} />
//       <Route component={NotFound} />
//     </Switch>
//   );
// }

// export default function App() {
//   // return (
//   //   <SidebarProvider>
//   //     <div className="flex h-screen w-screen bg-neutral-950 text-white overflow-hidden">
//   //       <AppSidebar />

//   //       <main className="flex-1 h-full overflow-auto">
//   //         <Home />
//   //       </main>
//   //     </div>
//   //   </SidebarProvider>
//   // )
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Router />
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }

import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./context/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp"; // We'll create this next

const PrivateRoute = ({ children, path }: { children: React.ReactNode; path: string }) => {
  const { user } = useAuth();
  return (
    <Route path={path}>{user ? children : <Redirect to="/signin" />}</Route>
  );
};

export default function App() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/signin">{user ? <Redirect to="/" /> : <SignIn />}</Route>
      <Route path="/signup">{user ? <Redirect to="/" /> : <SignUp />}</Route>

      <PrivateRoute path="/">
        <SidebarProvider>
          <div className="flex h-screen w-screen bg-neutral-950 text-white overflow-hidden">
            <AppSidebar />
            <main className="flex-1 h-full overflow-auto">
              <Home />
            </main>
          </div>
        </SidebarProvider>
      </PrivateRoute>

      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}