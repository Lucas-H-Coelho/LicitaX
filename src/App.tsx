import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { LicitacoesPage } from './pages/LicitacoesPage';
import { LicitacaoDetailPage } from './pages/LicitacaoDetailPage';
import { EmpresasPage } from './pages/EmpresasPage'; // Importa a nova página
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { supabase } from './lib/supabaseClient';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { ThemeProvider } from './hooks/use-theme';
import { Toaster } from "@/components/ui/sonner"
import { HomePage } from './pages/HomePage';


function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
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
            <Route path="/empresas" element={session ? <EmpresasPage /> : <Navigate to="/login" />} /> {/* Adiciona a rota para Empresas */}
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
