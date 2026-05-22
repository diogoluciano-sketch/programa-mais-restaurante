import { Home, CalendarDays, ClipboardCheck, LayoutDashboard, ExternalLink, LogOut, BarChart3, BookOpen, HardHat } from "lucide-react";
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
      title: "Cardápios da Semana",
      url: "/semana",
      icon: CalendarDays,
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
    },
    {
      title: "Relatório de Presença",
      url: "/relatorio",
      icon: BarChart3,
    },
    {
      title: "Diário de Leilão",
      url: "/diario-leilao",
      icon: BookOpen,
    },
    {
      title: "Prestadores de Serviço",
      url: "/prestadores",
      icon: HardHat,
    },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-1 flex flex-col items-center gap-2">
        <img
          src="https://lh3.googleusercontent.com/d/1y4DVWygWgn4i0QJs4puYzaSDxkhrSGCB"
          alt="Logo"
          className="w-20 h-20 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 object-contain"
        />
        <div className="flex flex-col items-center text-center group-data-[collapsible=icon]:hidden">
          <span className="font-black text-[11px] uppercase leading-tight tracking-tight whitespace-nowrap">Programa Mais Restaurante</span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Serviço de Alimentação</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarSeparator className="mb-1" />
          <SidebarGroupLabel className="text-center justify-center">Navegação</SidebarGroupLabel>
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
            <SidebarSeparator className="mb-1" />
            <SidebarGroupLabel className="text-center justify-center">Gestão</SidebarGroupLabel>
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

        <SidebarGroup>
          <SidebarSeparator className="mb-1" />
          <SidebarGroupLabel className="text-center justify-center">Atalhos</SidebarGroupLabel>
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
