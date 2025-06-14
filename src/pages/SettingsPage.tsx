import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Palette, ShieldCheck, KeyRound } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Mock state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loadingPasswordChange, setLoadingPasswordChange] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("As novas senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoadingPasswordChange(true);
    // First, reauthenticate if needed (Supabase might not require currentPassword for updateUser)
    // For changing password, Supabase's updateUser is used.
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message || "Falha ao alterar senha.");
    } else {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
    setLoadingPasswordChange(false);
  };


  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5" /> Aparência</CardTitle>
          <CardDescription>Personalize a aparência da plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-select">Tema</Label>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              className="p-2 border rounded-md bg-transparent"
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="system">Sistema</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5" /> Notificações</CardTitle>
          <CardDescription>Gerencie suas preferências de notificação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Notificações por Email</Label>
            <Switch
              id="email-notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Receba atualizações sobre novas licitações, status de propostas e alertas importantes.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5" /> Alterar Senha</CardTitle>
          <CardDescription>Atualize sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Supabase updateUser doesn't require current password, but good practice for some flows */}
            {/* <div className="space-y-1.5">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div> */}
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
              <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={loadingPasswordChange}>
              {loadingPasswordChange ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5" /> Segurança e Privacidade</CardTitle>
          <CardDescription>Gerencie suas configurações de segurança e dados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="outline">Gerenciar Sessões Ativas</Button>
            <p className="text-sm text-muted-foreground mt-1">Veja e desconecte sessões ativas em outros dispositivos.</p>
          </div>
          <div>
            <Button variant="destructive">Excluir Minha Conta</Button>
            <p className="text-sm text-muted-foreground mt-1">Esta ação é irreversível e excluirá todos os seus dados.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
