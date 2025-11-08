import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Home from "./pages/Home"

export default function App() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen bg-neutral-950 text-white overflow-hidden">
        <AppSidebar />

        <main className="flex-1 h-full overflow-auto">
          <Home />
        </main>
      </div>
    </SidebarProvider>
  )
}
