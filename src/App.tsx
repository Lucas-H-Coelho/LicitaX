import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { LicitacoesPage } from './pages/LicitacoesPage';
import { LicitacaoDetailPage } from './pages/LicitacaoDetailPage';
import { EmpresasPage } from './pages/EmpresasPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { supabase } from './lib/supabaseClient';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { ThemeProvider } from './hooks/use-theme';
import { Toaster } from "@/components/ui/sonner"
import { HomePage } from './pages/HomePage';
import { useLoadingStore } from './stores/loadingStore'; // Importa o store de loading

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [appInitLoading, setAppInitLoading] = useState(true); // Estado de loading local para o bootstrap do App
  const setGlobalLoading = useLoadingStore((state) => state.setLoading);

  useEffect(() => {
    const getSession = async () => {
      setGlobalLoading(true); // Ativa o indicador global
      setAppInitLoading(true); // Ativa o loader de página inteira do App
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error("Erro ao buscar sessão inicial:", error);
        // Poderia adicionar um toast aqui se necessário
      } finally {
        setAppInitLoading(false); // Desativa o loader de página inteira do App
        setGlobalLoading(false); // Desativa o indicador global
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        // Não é ideal disparar loading global para cada auth change,
        // a menos que uma ação específica esteja sendo esperada.
        // Se o usuário acabou de logar/deslogar, a navegação cuidará da UI.
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setGlobalLoading]);

  if (appInitLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p>Carregando aplicação...</p> {/* Mensagem mais específica */}
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="licitax-theme">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={session ? <Navigate to="/dashboard" /> : <HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            <Route path="/dashboard" element={session ? <DashboardPage /> : <Navigate to="/login" />} />
            <Route path="/licitacoes" element={session ? <LicitacoesPage /> : <Navigate to="/login" />} />
            <Route path="/licitacoes/:id" element={session ? <LicitacaoDetailPage /> : <Navigate to="/login" />} />
            <Route path="/empresas" element={session ? <EmpresasPage /> : <Navigate to="/login" />} />
            <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/settings" element={session ? <SettingsPage /> : <Navigate to="/login" />} />
            
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
