import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Search, Filter, ExternalLink, Building2, Tag, MapPin, Briefcase, CalendarDays, Users, Activity, 
  ChevronLeft, ChevronRight, PlusCircle, Trash2, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoadingStore } from '@/stores/loadingStore'; // Importa o store de loading

// Reflects structure from public.estabelecimento JOIN public.empresa and related lookups
interface EmpresaDetalhada {
  // From estabelecimento
  id_estabelecimento: string; 
  cnpj_basico: string;
  cnpj_ordem: string;
  cnpj_dv: string;
  nome_fantasia: string | null;
  situacao_cadastral: number | null; 
  data_inicio_atividade: number | null; 
  cnae_fiscal_principal: number | null; 
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
  uf: string | null;
  municipio: number | null; 
  
  empresa_info: {
    razao_social: string | null;
    natureza_juridica: number | null; 
    porte_empresa: number | null; 
    capital_social: number | null;
  } | null;

  cnae_info: {
    descricao: string | null;
  } | null;

  municipio_info: {
    descricao: string | null;
  } | null;
}

interface Cnae {
  codigo: number;
  descricao: string;
}

interface Municipio {
  codigo: number;
  descricao: string;
}

interface PorteEmpresa { 
  codigo: number;
  descricao: string; 
}

interface SituacaoCadastral { 
  codigo: number;
  descricao: string; 
}


const ITEMS_PER_PAGE = 9;

const SITUACAO_CADASTRAL_MAP: { [key: number]: string } = {
  1: 'NULA',
  2: 'ATIVA',
  3: 'SUSPENSA',
  4: 'INAPTA',
  8: 'BAIXADA',
};

const PORTE_EMPRESA_MAP: { [key: number]: string } = {
  1: 'NÃO INFORMADO',
  2: 'MICRO EMPRESA',
  3: 'EMPRESA DE PEQUENO PORTE',
  5: 'DEMAIS', 
};


export function EmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaDetalhada[]>([]);
  const [loadingSkeletons, setLoadingSkeletons] = useState(true); // Renomeado para clareza
  const [searchTerm, setSearchTerm] = useState('');
  const setGlobalLoading = useLoadingStore((state) => state.setLoading); // Hook do store global
  
  const [filters, setFilters] = useState({
    cnae_fiscal_principal: '', 
    uf: '',
    municipio: '', 
    porte_empresa: '', 
    situacao_cadastral: '', 
  });
  const [dateRangeFundacao, setDateRangeFundacao] = useState<DateRange | undefined>(undefined);

  const [cnaes, setCnaes] = useState<Cnae[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [portes, setPortes] = useState<PorteEmpresa[]>([]);
  const [situacoes, setSituacoes] = useState<SituacaoCadastral[]>([]);

  const [sortField, setSortField] = useState('data_inicio_atividade'); 
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();

  const formatCnpj = (basico: string, ordem: string, dv: string) => {
    if (!basico || !ordem || !dv) return 'N/A';
    return `${basico.padStart(8, '0').replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3/')}${ordem.padStart(4, '0')}-${dv.padStart(2, '0')}`;
  };
  
  const formatDateFromInt = (dateInt: number | null | undefined): string => {
    if (!dateInt) return 'N/A';
    const dateStr = dateInt.toString();
    if (dateStr.length !== 8) return 'Data Inválida';
    try {
      const parsedDate = parse(dateStr, 'yyyyMMdd', new Date());
      return format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data Inválida';
    }
  };

  const fetchFilterOptions = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const [cnaesRes, ufsRes, municipiosRes, portesRes, situacoesRes] = await Promise.all([
        supabase
          .from('estabelecimento')
          .select('cnae_fiscal_principal, cnae_info:cnae!inner(codigo, descricao)')
          .not('cnae_fiscal_principal', 'is', null)
          .then(response => {
            if (response.error) throw response.error;
            const uniqueCnaes = new Map<number, Cnae>();
            response.data?.forEach(item => {
              if (item.cnae_fiscal_principal && item.cnae_info && !uniqueCnaes.has(item.cnae_fiscal_principal)) {
                uniqueCnaes.set(item.cnae_fiscal_principal, { codigo: item.cnae_fiscal_principal, descricao: (item.cnae_info as any).descricao });
              }
            });
            return Array.from(uniqueCnaes.values()).sort((a,b) => a.descricao.localeCompare(b.descricao));
          }),
        supabase.rpc('get_distinct_column_values', { p_table_name: 'estabelecimento', p_column_name: 'uf' })
          .then(response => {
            if (response.error) throw response.error;
            return response.data?.filter((u: string | null) => u).sort() || [];
          }),
        supabase
          .from('estabelecimento')
          .select('municipio, municipio_info:munic!inner(codigo, descricao)')
          .not('municipio', 'is', null)
          .then(response => {
            if (response.error) throw response.error;
            const uniqueMunicipios = new Map<number, Municipio>();
            response.data?.forEach(item => {
              if (item.municipio && item.municipio_info && !uniqueMunicipios.has(item.municipio)) {
                uniqueMunicipios.set(item.municipio, { codigo: item.municipio, descricao: (item.municipio_info as any).descricao });
              }
            });
            return Array.from(uniqueMunicipios.values()).sort((a,b) => a.descricao.localeCompare(b.descricao));
          }),
        supabase
          .from('empresa')
          .select('porte_empresa')
          .not('porte_empresa', 'is', null)
          .then(response => {
            if (response.error) throw response.error;
            const distinctPortes = Array.from(new Set(response.data?.map(p => p.porte_empresa).filter(p => p !== null))) as number[];
            return distinctPortes.map(code => ({ codigo: code, descricao: PORTE_EMPRESA_MAP[code] || `Porte ${code}` })).sort((a,b) => a.descricao.localeCompare(b.descricao));
          }),
        supabase
          .from('estabelecimento')
          .select('situacao_cadastral')
          .not('situacao_cadastral', 'is', null)
          .then(response => {
            if (response.error) throw response.error;
            const distinctSituacoes = Array.from(new Set(response.data?.map(s => s.situacao_cadastral).filter(s => s !== null))) as number[];
            return distinctSituacoes.map(code => ({ codigo: code, descricao: SITUACAO_CADASTRAL_MAP[code] || `Situação ${code}` })).sort((a,b) => a.descricao.localeCompare(b.descricao));
          })
      ]);
      setCnaes(cnaesRes);
      setUfs(ufsRes);
      setMunicipios(municipiosRes);
      setPortes(portesRes);
      setSituacoes(situacoesRes);
    } catch (error: any) {
      console.error('Falha ao carregar opções de filtro:', error);
      toast.error(`Falha ao carregar opções de filtro: ${error.message}`);
    } finally {
      setGlobalLoading(false);
    }
  }, [setGlobalLoading]);

  const fetchEmpresas = useCallback(async () => {
    setGlobalLoading(true);
    setLoadingSkeletons(true);
    try {
      let query = supabase
        .from('estabelecimento')
        .select(`
          cnpj_basico, cnpj_ordem, cnpj_dv, nome_fantasia, situacao_cadastral, data_inicio_atividade, 
          cnae_fiscal_principal, logradouro, numero, complemento, bairro, cep, uf, municipio,
          empresa_info:empresa!inner(razao_social, natureza_juridica, porte_empresa, capital_social),
          cnae_info:cnae(codigo, descricao),
          municipio_info:munic(codigo, descricao)
        `, { count: 'exact' });

      if (searchTerm) {
        const searchLower = `%${searchTerm.toLowerCase()}%`;
        query = query.or(
          `nome_fantasia.ilike.${searchLower},empresa_info.razao_social.ilike.${searchLower},cnpj_basico.ilike.${searchTerm.replace(/\D/g, '')}%`
        );
      }
      
      if (filters.cnae_fiscal_principal) query = query.eq('cnae_fiscal_principal', parseInt(filters.cnae_fiscal_principal));
      if (filters.uf) query = query.eq('uf', filters.uf);
      if (filters.municipio) query = query.eq('municipio', parseInt(filters.municipio));
      if (filters.porte_empresa) query = query.eq('empresa_info.porte_empresa', parseInt(filters.porte_empresa));
      if (filters.situacao_cadastral) query = query.eq('situacao_cadastral', parseInt(filters.situacao_cadastral));
      
      if (dateRangeFundacao?.from) {
        query = query.gte('data_inicio_atividade', parseInt(format(dateRangeFundacao.from, 'yyyyMMdd')));
      }
      if (dateRangeFundacao?.to) {
        query = query.lte('data_inicio_atividade', parseInt(format(dateRangeFundacao.to, 'yyyyMMdd')));
      }
      
      const sortColumn = sortField.startsWith('empresa_info.') ? sortField : sortField;
      query = query.order(sortColumn, { 
          ascending: sortOrder === 'asc', 
          nullsFirst: false,
          foreignTable: sortField.includes('.') ? sortField.split('.')[0] : undefined
      });

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar empresas:', error);
        toast.error(`Falha ao carregar empresas: ${error.message}`);
        setEmpresas([]);
      } else {
        const mappedData = data?.map(d => ({
          ...d,
          id_estabelecimento: `${d.cnpj_basico}-${d.cnpj_ordem}-${d.cnpj_dv}`,
          empresa_info: d.empresa_info ? d.empresa_info[0] || d.empresa_info : null,
        })) as EmpresaDetalhada[] || [];
        setEmpresas(mappedData);
        setTotalCount(count || 0);
      }
    } catch (err: any) {
      console.error('Erro inesperado ao buscar empresas:', err);
      toast.error(`Falha inesperada ao carregar empresas: ${err.message}`);
      setEmpresas([]);
      setTotalCount(0);
    } finally {
      setLoadingSkeletons(false);
      setGlobalLoading(false);
    }
  }, [searchTerm, filters, sortField, sortOrder, currentPage, dateRangeFundacao, setGlobalLoading]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);
  
  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  useEffect(() => {
    const createRpcFunction = async () => {
      await supabase.rpc('sql', {
        sql: `
        CREATE OR REPLACE FUNCTION get_distinct_column_values(p_table_name TEXT, p_column_name TEXT)
        RETURNS SETOF TEXT AS $$
        BEGIN
            RETURN QUERY EXECUTE format('SELECT DISTINCT %I::text FROM %I WHERE %I IS NOT NULL ORDER BY 1', p_column_name, p_table_name, p_column_name);
        END;
        $$ LANGUAGE plpgsql;
        `
      }).catch(err => console.warn("Failed to create/update RPC 'get_distinct_column_values', it might already exist or there are permission issues:", err.message));
    };
    createRpcFunction();
  }, []);


  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const handleDateRangeChange = (selectedRange: DateRange | undefined) => {
    setDateRangeFundacao(selectedRange);
    setCurrentPage(1);
  }

  const clearFilters = () => {
    setFilters({
      cnae_fiscal_principal: '', uf: '', municipio: '', porte_empresa: '', situacao_cadastral: '',
    });
    setDateRangeFundacao(undefined);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const renderSkeletonCards = () => (
    Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
      <Card key={`skeleton-${index}`} className="flex flex-col">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    ))
  );

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
              placeholder="Buscar por Razão Social, Nome Fantasia, CNPJ..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-8 w-full"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Select value={filters.cnae_fiscal_principal} onValueChange={(v) => handleFilterChange('cnae_fiscal_principal', v)}>
              <SelectTrigger><SelectValue placeholder="CNAE Principal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos CNAEs</SelectItem>
                {cnaes.map(c => <SelectItem key={c.codigo} value={c.codigo.toString()}>{c.descricao} ({c.codigo})</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.uf} onValueChange={(v) => handleFilterChange('uf', v)}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas UFs</SelectItem>
                {ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.municipio} onValueChange={(v) => handleFilterChange('municipio', v)}>
              <SelectTrigger><SelectValue placeholder="Município" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos Municípios</SelectItem>
                {municipios.map(m => <SelectItem key={m.codigo} value={m.codigo.toString()}>{m.descricao} ({m.codigo})</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.porte_empresa} onValueChange={(v) => handleFilterChange('porte_empresa', v)}>
              <SelectTrigger><SelectValue placeholder="Porte da Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos Portes</SelectItem>
                {portes.map(p => <SelectItem key={p.codigo} value={p.codigo.toString()}>{p.descricao}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.situacao_cadastral} onValueChange={(v) => handleFilterChange('situacao_cadastral', v)}>
              <SelectTrigger><SelectValue placeholder="Situação Cadastral" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas Situações</SelectItem>
                {situacoes.map(s => <SelectItem key={s.codigo} value={s.codigo.toString()}>{s.descricao}</SelectItem>)}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateRangeFundacao?.from ? (
                    dateRangeFundacao.to ? (
                      `${format(dateRangeFundacao.from, "dd/MM/yy", { locale: ptBR })} - ${format(dateRangeFundacao.to, "dd/MM/yy", { locale: ptBR })}`
                    ) : (
                      format(dateRangeFundacao.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Data de Início Atividade</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRangeFundacao}
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
          {totalCount > 0 ? `${totalCount} empresa(s) encontrada(s)` : loadingSkeletons ? 'Buscando...' : 'Nenhuma empresa encontrada'}
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
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="empresa_info.razao_social-asc">Razão Social (A-Z)</SelectItem>
              <SelectItem value="empresa_info.razao_social-desc">Razão Social (Z-A)</SelectItem>
              <SelectItem value="nome_fantasia-asc">Nome Fantasia (A-Z)</SelectItem>
              <SelectItem value="nome_fantasia-desc">Nome Fantasia (Z-A)</SelectItem>
              <SelectItem value="data_inicio_atividade-desc">Início Atividade (Mais Recente)</SelectItem>
              <SelectItem value="data_inicio_atividade-asc">Início Atividade (Mais Antiga)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loadingSkeletons ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{renderSkeletonCards()}</div>
      ) : empresas.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Info className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">Nenhuma empresa encontrada.</p>
            <p className="text-sm">Tente ajustar seus filtros ou termos de busca.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {empresas.map((est) => (
            <Card key={est.id_estabelecimento} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">{est.nome_fantasia || est.empresa_info?.razao_social || 'Nome não disponível'}</CardTitle>
                  {est.situacao_cadastral && (
                    <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                      est.situacao_cadastral === 2 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                      est.situacao_cadastral === 8 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {SITUACAO_CADASTRAL_MAP[est.situacao_cadastral] || `Situação ${est.situacao_cadastral}`}
                    </span>
                  )}
                </div>
                <CardDescription className="text-sm pt-1">
                  CNPJ: {formatCnpj(est.cnpj_basico, est.cnpj_ordem, est.cnpj_dv)}
                </CardDescription>
                {est.empresa_info?.razao_social && est.nome_fantasia && est.empresa_info.razao_social !== est.nome_fantasia && (
                   <CardDescription className="text-xs pt-0.5 text-muted-foreground">
                     Razão Social: {est.empresa_info.razao_social}
                   </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                {est.cnae_info?.descricao && (
                  <div className="flex items-center text-muted-foreground">
                    <Briefcase className="mr-1.5 h-4 w-4 flex-shrink-0" /> Setor: {est.cnae_info.descricao}
                  </div>
                )}
                {(est.municipio_info?.descricao || est.uf) && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0" /> 
                    {est.municipio_info?.descricao}{est.municipio_info?.descricao && est.uf ? ', ' : ''}{est.uf}
                  </div>
                )}
                {est.empresa_info?.porte_empresa && (
                  <div className="flex items-center text-muted-foreground">
                    <Users className="mr-1.5 h-4 w-4 flex-shrink-0" /> Porte: {PORTE_EMPRESA_MAP[est.empresa_info.porte_empresa] || `Porte ${est.empresa_info.porte_empresa}`}
                  </div>
                )}
                {est.data_inicio_atividade && (
                  <div className="flex items-center text-muted-foreground">
                    <CalendarDays className="mr-1.5 h-4 w-4 flex-shrink-0" /> Início Ativ.: {formatDateFromInt(est.data_inicio_atividade)}
                  </div>
                )}
                 {est.logradouro && (
                  <div className="flex items-start text-muted-foreground">
                     <MapPin className="mr-1.5 h-4 w-4 mt-0.5 flex-shrink-0" /> 
                     <span>{est.logradouro}, {est.numero || 'S/N'}{est.complemento ? ` - ${est.complemento}` : ''} - {est.bairro || 'Bairro não informado'}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => navigate(`/empresas/${est.id_estabelecimento}`)}>
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
            disabled={currentPage === 1 || loadingSkeletons}
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
            disabled={currentPage === totalPages || loadingSkeletons}
          >
            Próxima <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
