import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner"
import { Briefcase } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // options: { data: { full_name: 'Nome Completo Aqui' } } // Adicione campos extras se necessário
    });

    if (error) {
      toast.error(error.message || "Falha no cadastro. Tente novamente.");
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      // This case might indicate an existing user trying to sign up again with email/password
      // when they might have signed up with a social provider or if email confirmation is pending.
      // Supabase default behavior is to not error but return a user object that might seem "incomplete".
      // For email/password, if email confirmation is enabled, they need to confirm.
      // If email confirmation is disabled (default for Supabase local), it should log them in or create the user.
      toast.info("Usuário já existe ou requer confirmação de e-mail. Tente fazer login.");
      navigate('/login');
    }
     else {
      toast.success("Cadastro realizado com sucesso! Você será redirecionado para o login.");
      // Supabase signUp does not automatically sign in the user if email confirmation is required.
      // If email confirmation is disabled (typical for local dev), it might sign them in.
      // For a consistent experience, redirect to login.
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
           <div className="inline-flex items-center justify-center text-primary mb-2">
            <Briefcase size={32} />
          </div>
          <CardTitle className="text-2xl">Criar Conta no LicitaX</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para se cadastrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
