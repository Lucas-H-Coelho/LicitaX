import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, LogOut, User, Briefcase, Moon, Sun, Settings, Menu, X } from 'lucide-react'; // Added Menu, X
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/hooks/use-theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'; // Added Sheet components
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

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <Home className="mr-2 h-4 w-4" /> },
    { to: "/licitacoes", label: "Licitações", icon: <Briefcase className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
        {/* Desktop Navigation */}
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Briefcase className="h-6 w-6" />
            <span className="font-bold">LicitaX</span>
          </Link>
          {session && navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground transition-colors hover:text-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
              // Basic active state, can be improved with NavLink from react-router-dom if needed
              onClick={(e) => {
                // Example of setting active state, better handled by NavLink
                document.querySelectorAll('nav a').forEach(a => a.setAttribute('data-active', 'false'));
                e.currentTarget.setAttribute('data-active', 'true');
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation Trigger & Logo */}
        <div className="flex items-center gap-2 md:hidden">
          {session && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium p-6">
                  <Link
                    to="/"
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                  >
                    <Briefcase className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">LicitaX</span>
                  </Link>
                  {navLinks.map(link => (
                    <SheetClose asChild key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Briefcase className="h-6 w-6" />
            <span className="font-bold">LicitaX</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.user_metadata?.avatar_url} alt={session.user?.email || 'User'} />
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
              <Button onClick={() => navigate('/login')} variant="outline" size="sm">Login</Button>
              <Button onClick={() => navigate('/signup')} size="sm">Cadastrar</Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="border-t bg-muted/40 py-4 px-4 md:px-6 text-center text-xs sm:text-sm text-muted-foreground">
        © {new Date().getFullYear()} LicitaX. Todos os direitos reservados. Feito com ⚡️ por Bolt.
      </footer>
    </div>
  );
}
