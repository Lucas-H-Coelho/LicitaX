import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User, Edit3, Save, Mail, Briefcase, Building } from 'lucide-react';

interface Profile {
  id: string;
  nome: string | null;
  tipo: string | null; // e.g., 'consultor', 'empresa'
  avatar_url: string | null;
  bio: string | null;
  // Add other fields from your 'profiles' table
}

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');


  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || '');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows
        console.error('Erro ao buscar perfil:', error);
        toast.error("Falha ao carregar perfil.");
      } else if (data) {
        setProfile(data);
        setNome(data.nome || '');
        setTipo(data.tipo || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }
    }
    setLoading(false);
  }

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const updates = {
        id: user.id,
        nome,
        tipo,
        bio,
        avatar_url: avatarUrl, // For now, just a URL. File upload would be more complex.
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        toast.error(error.message || "Falha ao atualizar perfil.");
      } else {
        toast.success("Perfil atualizado com sucesso!");
        setEditing(false);
        fetchProfile(); // Refresh profile data
      }
    }
    setLoading(false);
  };
  
  const userInitial = email ? email.charAt(0).toUpperCase() : (nome ? nome.charAt(0).toUpperCase() : 'U');

  if (loading && !profile) { // Show loading only on initial fetch
    return <div className="flex justify-center items-center h-screen"><p>Carregando perfil...</p></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || undefined} alt={nome || 'Avatar do usuário'} />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{editing ? 'Editando Perfil' : nome || 'Nome não definido'}</CardTitle>
              <CardDescription className="flex items-center">
                <Mail className="mr-1.5 h-4 w-4 text-muted-foreground" /> {email}
              </CardDescription>
              {tipo && !editing && (
                 <CardDescription className="flex items-center mt-1">
                  {tipo.toLowerCase() === 'empresa' ? <Building className="mr-1.5 h-4 w-4 text-muted-foreground" /> : <Briefcase className="mr-1.5 h-4 w-4 text-muted-foreground" />}
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo / Razão Social</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome ou nome da empresa" />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de Conta</Label>
                 <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-transparent">
                  <option value="">Selecione o tipo</option>
                  <option value="consultor">Consultor(a)</option>
                  <option value="empresa">Empresa</option>
                  <option value="representante">Representante</option>
                 </select>
              </div>
              <div>
                <Label htmlFor="avatarUrl">URL do Avatar/Logo</Label>
                <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://exemplo.com/avatar.png" />
              </div>
              <div>
                <Label htmlFor="bio">Sobre Mim / Minha Empresa</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre você ou sua empresa..." rows={4} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => { setEditing(false); fetchProfile(); /* Reset changes */ }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                <p>{nome || 'Não informado'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tipo de Conta</h3>
                <p>{tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Não informado'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Sobre</h3>
                <p className="whitespace-pre-wrap">{bio || 'Nenhuma biografia adicionada.'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
