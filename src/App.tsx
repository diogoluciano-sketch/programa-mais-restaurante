import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Survey from "./pages/Survey";
import AuthContainer from "./components/AuthContainer.tsx";

import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthContainer>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/pesquisa" element={<Survey />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthContainer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
