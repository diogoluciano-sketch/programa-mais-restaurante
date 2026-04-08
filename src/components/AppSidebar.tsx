import { Home, ClipboardCheck, LayoutDashboard, ExternalLink, LogOut, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { isUserAdmin } from "@/lib/constants";
import { Link, useLocation } from "react-router-dom";

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      title: "Cardápio do Dia",
      url: "/",
      icon: Home,
    },
    {
      title: "Pesquisa de Satisfação",
      url: "/pesquisa",
      icon: ClipboardCheck,
    },
  ];

  const adminItems = [
    {
      title: "Painel Administrativo",
      url: "/admin",
      icon: LayoutDashboard,
    }
  ];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <img 
            src="https://lh3.googleusercontent.com/d/1y4DVWygWgn4i0QJs4puYzaSDxkhrSGCB" 
            alt="Logo" 
            className="w-5 h-5 object-contain invert brightness-0" 
          />
        </div>
        <div className="flex flex-col truncate">
          <span className="font-bold text-sm leading-tight">Programa +</span>
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Restaurante</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isUserAdmin(user?.email) && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Atalhos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  tooltip="Intranet"
                >
                  <a 
                    href="https://sites.google.com/programaleiloes.com/intranetprogramaleiles/home" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink />
                    <span>Intranet</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={logout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              tooltip="Sair"
            >
              <LogOut className="rotate-180" />
              <span>Sair da Conta</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
