import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom'; // Corrected import
import { PlusCircle, Search, Filter, ExternalLink, CalendarDays, Tag, Landmark, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

// Define a type for Licitacao for better type safety
interface Licitacao {
  id: number;
  numero: string;
  orgao: string;
  objeto: string;
  modalidade: string;
  status: string;
  valor_estimado: string | null;
  data_abertura: string; // Assuming ISO string format
  // Add other fields from your 'licitacoes' table as needed
}

export function LicitacoesPage() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterModalidade, setFilterModalidade] = useState('todas');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLicitacoes();
  }, []);

  async function fetchLicitacoes() {
    setLoading(true);
    let query = supabase.from('licitacoes').select('*');

    // Example: if you want to order by data_abertura descending
    query = query.order('data_abertura', { ascending: false });
    
    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar licitações:', error);
      toast.error("Falha ao carregar licitações.");
      setLicitacoes([]);
    } else {
      setLicitacoes(data as Licitacao[]);
    }
    setLoading(false);
  }

  const filteredLicitacoes = licitacoes.filter(lic => {
    const matchesSearchTerm = 
      lic.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.orgao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.objeto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || lic.status === filterStatus;
    const matchesModalidade = filterModalidade === 'todas' || lic.modalidade === filterModalidade;
    return matchesSearchTerm && matchesStatus && matchesModalidade;
  });

  const modalidadesUnicas = Array.from(new Set(licitacoes.map(l => l.modalidade)));
  const statusUnicos = Array.from(new Set(licitacoes.map(l => l.status)));


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Licitações</h1>
        </div>
        <p>Carregando licitações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Licitações</h1>
        <Button onClick={() => navigate('/licitacoes/nova')}> {/* Adjust route as needed */}
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Licitação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
          <CardDescription>Refine sua busca por licitações.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="search" className="text-sm font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Número, órgão, objeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="status" className="text-sm font-medium">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                {statusUnicos.map(status => (
                  <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="modalidade" className="text-sm font-medium">Modalidade</label>
            <Select value={filterModalidade} onValueChange={setFilterModalidade}>
              <SelectTrigger id="modalidade">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Modalidades</SelectItem>
                 {modalidadesUnicas.map(mod => (
                  <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredLicitacoes.length === 0 && !loading ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma licitação encontrada com os filtros aplicados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLicitacoes.map((licitacao) => (
            <Card key={licitacao.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">{licitacao.numero}</CardTitle>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    licitacao.status === 'aberta' ? 'bg-green-100 text-green-800' : 
                    licitacao.status === 'encerrada' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {licitacao.status.charAt(0).toUpperCase() + licitacao.status.slice(1)}
                  </span>
                </div>
                <CardDescription className="flex items-center text-sm pt-1">
                  <Landmark className="mr-1.5 h-4 w-4 text-muted-foreground" /> {licitacao.orgao}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{licitacao.objeto}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Briefcase className="mr-1.5 h-3.5 w-3.5" /> Modalidade: {licitacao.modalidade}
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Abertura: {new Date(licitacao.data_abertura).toLocaleDateString()}
                  </div>
                  {licitacao.valor_estimado && (
                    <div className="flex items-center">
                      <Tag className="mr-1.5 h-3.5 w-3.5" /> Valor Estimado: R$ {parseFloat(licitacao.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => navigate(`/licitacoes/${licitacao.id}`)}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Ver Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
