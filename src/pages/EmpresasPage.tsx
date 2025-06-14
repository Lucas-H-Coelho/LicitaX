import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Search, Filter, ExternalLink, Building2, Tag, MapPin, Briefcase, CalendarDays, Users, Activity, 
  ListOrdered, ArrowUpDown, ChevronLeft, ChevronRight, PlusCircle, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Empresa {
  id: string;
  nome_fantasia: string | null;
  razao_social: string;
  cnpj: string;
  area_de_atuacao_principal: string | null;
  tags_descritivas: string[] | null;
  setor_atuacao_id: string | null;
  setores_atuacao: { nome: string } | null; // For joined data
  estado: string | null;
  cidade: string | null;
  porte_empresa: string | null;
  data_fundacao: string | null; // ISO string
  status_empresa: string;
  created_at: string; // ISO string
}

interface SetorAtuacao {
  id: string;
  nome: string;
}

const ITEMS_PER_PAGE = 9;
const PORTE_EMPRESA_OPTIONS = ['Pequena', 'Média', 'Grande', 'Microempresa', 'Empresa de Pequeno Porte'];
const STATUS_EMPRESA_OPTIONS = ['Ativa', 'Inativa', 'Em Liquidação', 'Suspensa'];

export function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    setor_atuacao_id: '',
    estado: '',
    cidade: '',
    porte_empresa: '',
    status_empresa: '',
    data_fundacao_inicio: '',
    data_fundacao_fim: '',
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Filter options
  const [setores, setSetores] = useState<SetorAtuacao[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);

  // Sorting
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();

  const fetchFilterOptions = useCallback(async () => {
    // Fetch Setores
    const { data: setoresData, error: setoresError } = await supabase
      .from('setores_atuacao')
      .select('id, nome')
      .order('nome', { ascending: true });
    if (setoresError) toast.error('Falha ao carregar setores.');
    else setSetores(setoresData || []);

    // Fetch distinct Estados (consider performance for very large datasets)
    const { data: estadosData, error: estadosError } = await supabase
      .rpc('get_distinct_column_values', { p_table_name: 'empresas', p_column_name: 'estado' });
    if (estadosError) toast.error('Falha ao carregar estados.');
    else setEstados(estadosData?.filter((e: string | null) => e) || []);
    
    // Fetch distinct Cidades (consider performance)
    const { data: cidadesData, error: cidadesError } = await supabase
      .rpc('get_distinct_column_values', { p_table_name: 'empresas', p_column_name: 'cidade' });
    if (cidadesError) toast.error('Falha ao carregar cidades.');
    else setCidades(cidadesData?.filter((c: string | null) => c) || []);

  }, []);

  const fetchEmpresas = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('empresas')
      .select('*, setores_atuacao(nome)', { count: 'exact' });

    // Text Search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      query = query.or(
        `nome_fantasia.ilike.%${searchLower}%,razao_social.ilike.%${searchLower}%,cnpj.ilike.%${searchLower}%,area_de_atuacao_principal.ilike.%${searchLower}%,tags_descritivas.cs.{${searchLower}}`
      );
    }

    // Filters
    if (filters.setor_atuacao_id) query = query.eq('setor_atuacao_id', filters.setor_atuacao_id);
    if (filters.estado) query = query.eq('estado', filters.estado);
    if (filters.cidade) query = query.eq('cidade', filters.cidade);
    if (filters.porte_empresa) query = query.eq('porte_empresa', filters.porte_empresa);
    if (filters.status_empresa) query = query.eq('status_empresa', filters.status_empresa);
    if (dateRange?.from) query = query.gte('data_fundacao', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) query = query.lte('data_fundacao', format(dateRange.to, 'yyyy-MM-dd'));
    
    // Sorting
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      toast.error("Falha ao carregar empresas.");
      setEmpresas([]);
    } else {
      setEmpresas(data as Empresa[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [searchTerm, filters, sortField, sortOrder, currentPage, dateRange]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);
  
  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  // Helper function to create RPC for distinct values if not exists
  useEffect(() => {
    const createRpcFunction = async () => {
      await supabase.rpc('sql', {
        sql: `
        CREATE OR REPLACE FUNCTION get_distinct_column_values(p_table_name TEXT, p_column_name TEXT)
        RETURNS SETOF TEXT AS $$
        BEGIN
            RETURN QUERY EXECUTE format('SELECT DISTINCT %I FROM %I WHERE %I IS NOT NULL ORDER BY 1', p_column_name, p_table_name, p_column_name);
        END;
        $$ LANGUAGE plpgsql;
        `
      }).catch(console.warn); // Ignore if exists or permission issues, handle in UI
    };
    createRpcFunction();
  }, []);


  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const handleDateRangeChange = (selectedRange: DateRange | undefined) => {
    setDateRange(selectedRange);
    setCurrentPage(1);
  }

  const clearFilters = () => {
    setFilters({
      setor_atuacao_id: '',
      estado: '',
      cidade: '',
      porte_empresa: '',
      status_empresa: '',
      data_fundacao_inicio: '',
      data_fundacao_fim: '',
    });
    setDateRange(undefined);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Building2 className="mr-3 h-8 w-8" /> Empresas
        </h1>
        <Button onClick={() => navigate('/empresas/nova')}> {/* TODO: Implementar rota de nova empresa */}
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5" /> Filtros e Busca</CardTitle>
          <CardDescription>Refine sua busca por empresas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Nome, Razão Social, CNPJ, Área de Atuação, Tags..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-8 w-full"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Select value={filters.setor_atuacao_id} onValueChange={(v) => handleFilterChange('setor_atuacao_id', v)}>
              <SelectTrigger><SelectValue placeholder="Setor de Atuação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos Setores</SelectItem>
                {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.estado} onValueChange={(v) => handleFilterChange('estado', v)}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos Estados</SelectItem>
                {estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.cidade} onValueChange={(v) => handleFilterChange('cidade', v)}>
              <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas Cidades</SelectItem>
                {cidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.porte_empresa} onValueChange={(v) => handleFilterChange('porte_empresa', v)}>
              <SelectTrigger><SelectValue placeholder="Porte da Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos Portes</SelectItem>
                {PORTE_EMPRESA_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status_empresa} onValueChange={(v) => handleFilterChange('status_empresa', v)}>
              <SelectTrigger><SelectValue placeholder="Status da Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos Status</SelectItem>
                {STATUS_EMPRESA_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "dd/MM/yy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yy", { locale: ptBR })}`
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Data de Fundação</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  locale={ptBR}
                  initialFocus
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={clearFilters} variant="outline" size="sm">
            <Trash2 className="mr-2 h-4 w-4" /> Limpar Filtros
          </Button>
        </CardFooter>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          {totalCount > 0 ? `${totalCount} empresa(s) encontrada(s)` : 'Nenhuma empresa encontrada'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <Select 
            value={`${sortField}-${sortOrder}`} 
            onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortField(field);
              setSortOrder(order as 'asc' | 'desc');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome_fantasia-asc">Nome Fantasia (A-Z)</SelectItem>
              <SelectItem value="nome_fantasia-desc">Nome Fantasia (Z-A)</SelectItem>
              <SelectItem value="created_at-desc">Data Cadastro (Mais Recente)</SelectItem>
              <SelectItem value="created_at-asc">Data Cadastro (Mais Antiga)</SelectItem>
              <SelectItem value="data_fundacao-desc">Data Fundação (Mais Recente)</SelectItem>
              <SelectItem value="data_fundacao-asc">Data Fundação (Mais Antiga)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10">Carregando empresas...</p>
      ) : empresas.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma empresa encontrada com os filtros aplicados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {empresas.map((empresa) => (
            <Card key={empresa.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">{empresa.nome_fantasia || empresa.razao_social}</CardTitle>
                  <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                    empresa.status_empresa === 'Ativa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                    empresa.status_empresa === 'Inativa' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' // Default for other statuses
                  }`}>
                    {empresa.status_empresa}
                  </span>
                </div>
                <CardDescription className="text-sm pt-1">
                  CNPJ: {empresa.cnpj}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                {empresa.setores_atuacao?.nome && (
                  <div className="flex items-center text-muted-foreground">
                    <Briefcase className="mr-1.5 h-4 w-4" /> Setor: {empresa.setores_atuacao.nome}
                  </div>
                )}
                {(empresa.cidade || empresa.estado) && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-1.5 h-4 w-4" /> 
                    {empresa.cidade}{empresa.cidade && empresa.estado ? ', ' : ''}{empresa.estado}
                  </div>
                )}
                {empresa.porte_empresa && (
                  <div className="flex items-center text-muted-foreground">
                    <Users className="mr-1.5 h-4 w-4" /> Porte: {empresa.porte_empresa}
                  </div>
                )}
                {empresa.data_fundacao && (
                  <div className="flex items-center text-muted-foreground">
                    <CalendarDays className="mr-1.5 h-4 w-4" /> Fundação: {new Date(empresa.data_fundacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                )}
                {empresa.tags_descritivas && empresa.tags_descritivas.length > 0 && (
                  <div className="flex items-start text-muted-foreground">
                    <Tag className="mr-1.5 h-4 w-4 mt-0.5 shrink-0" /> 
                    <div className="flex flex-wrap gap-1">
                      {empresa.tags_descritivas.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 text-xs bg-muted rounded">{tag}</span>
                      ))}
                      {empresa.tags_descritivas.length > 3 && <span className="text-xs text-muted-foreground self-center">...</span>}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => navigate(`/empresas/${empresa.id}`)}> {/* TODO: Implementar rota de detalhe */}
                  <ExternalLink className="mr-2 h-4 w-4" /> Ver Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Próxima <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
