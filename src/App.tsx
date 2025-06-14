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
import { useLoadingStore } from './stores/loadingStore';
import ErrorBoundary from './components/ErrorBoundary'; // Importa o ErrorBoundary

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [appInitLoading, setAppInitLoading] = useState(true);
  const setGlobalLoading = useLoadingStore((state) => state.setLoading);

  useEffect(() => {
    const getSession = async () => {
      setGlobalLoading(true); 
      setAppInitLoading(true); 
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error("Erro ao buscar sessão inicial:", error);
      } finally {
        setAppInitLoading(false); 
        setGlobalLoading(false); 
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setGlobalLoading]);

  if (appInitLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p>Carregando aplicação...</p>
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
            
            <Route 
              path="/dashboard" 
              element={session ? <DashboardPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/licitacoes" 
              element={session ? <LicitacoesPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/licitacoes/:id" 
              element={session ? <LicitacaoDetailPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/empresas" 
              element={
                session ? (
                  <ErrorBoundary 
                    fallback={
                      <div className="p-4 text-center text-red-600 bg-red-50 border border-red-200 rounded-md">
                        <h2 className="text-xl font-semibold">Erro ao carregar a página de Empresas.</h2>
                        <p>Por favor, verifique o console para mais detalhes ou tente atualizar.</p>
                      </div>
                    }
                  >
                    <EmpresasPage />
                  </ErrorBoundary>
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/profile" 
              element={session ? <ProfilePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/settings" 
              element={session ? <SettingsPage /> : <Navigate to="/login" />} 
            />
            
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
