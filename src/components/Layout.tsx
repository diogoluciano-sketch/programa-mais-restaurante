import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 sticky top-0 z-30">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
             <h1 className="text-sm font-bold truncate pr-4">
                {location.pathname === "/" && "🍽️ Cardápio do Dia"}
                {location.pathname === "/pesquisa" && "⭐ Pesquisa de Satisfação"}
                {location.pathname === "/admin" && "⚙️ Painel Administrativo"}
             </h1>
          </div>
        </div>
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
