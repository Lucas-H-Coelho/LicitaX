import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, LogOut, User, Briefcase, FileText, Moon, Sun, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/hooks/use-theme'; // We'll create this hook
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';

export function Layout() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [userInitial, setUserInitial] = useState<string>('U');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        setUserInitial(session.user.email.charAt(0).toUpperCase());
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        setUserInitial(session.user.email.charAt(0).toUpperCase());
      } else {
        setUserInitial('U');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Briefcase className="h-6 w-6" />
            <span>LicitaX</span>
          </Link>
          {session && (
            <>
              <Link
                to="/dashboard"
                className="text-foreground transition-colors hover:text-foreground/80"
              >
                Dashboard
              </Link>
              <Link
                to="/licitacoes"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Licitações
              </Link>
            </>
          )}
        </nav>
        {/* Mobile Nav Placeholder - can be implemented with Sheet component */}
        <div className="md:hidden">
           <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Briefcase className="h-6 w-6" />
            <span>LicitaX</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    {/* Placeholder for user avatar image */}
                    {/* <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" /> */}
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => navigate('/login')} variant="outline">Login</Button>
              <Button onClick={() => navigate('/signup')}>Cadastrar</Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Outlet />
      </main>
      <footer className="border-t bg-background py-4 px-4 md:px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LicitaX. Todos os direitos reservados.
      </footer>
    </div>
  );
}
