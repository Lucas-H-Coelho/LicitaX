import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CalendarDays, Landmark, Tag, FileText, Briefcase, Paperclip, Download, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface Licitacao {
  id: number;
  numero: string;
  orgao: string;
  objeto: string;
  modalidade: string;
  status: string;
  valor_estimado: string | null;
  data_abertura: string;
  data_fechamento: string | null;
  descricao: string | null;
  // Add other fields from your 'licitacoes' table
}

interface Documento {
  id: number;
  nome: string;
  tipo: string;
  url: string; // Assuming this is a direct download link or a link to a Supabase Storage object
  tamanho: number | null; // in bytes
  // Add other fields from your 'documentos' table
}

interface Proposta {
  id: number;
  valor: string;
  status: string;
  data_envio: string;
  empresa_id: number; // or string, depending on your schema (user_id or profile_id)
  // Add other fields from your 'propostas' table
}


export function LicitacaoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [licitacao, setLicitacao] = useState<Licitacao | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLicitacaoDetails();
    }
  }, [id]);

  async function fetchLicitacaoDetails() {
    setLoading(true);
    try {
      const { data: licitacaoData, error: licitacaoError } = await supabase
        .from('licitacoes')
        .select('*')
        .eq('id', id)
        .single();

      if (licitacaoError) throw licitacaoError;
      setLicitacao(licitacaoData);

      const { data: documentosData, error: documentosError } = await supabase
        .from('documentos')
        .select('*')
        .eq('licitacao_id', id);
      
      if (documentosError) throw documentosError;
      setDocumentos(documentosData || []);

      const { data: propostasData, error: propostasError } = await supabase
        .from('propostas')
        .select('*')
        .eq('licitacao_id', id);

      if (propostasError) throw propostasError;
      setPropostas(propostasData || []);

    } catch (error: any) {
      console.error('Erro ao buscar detalhes da licitação:', error);
      toast.error(error.message || "Falha ao carregar detalhes da licitação.");
      navigate('/licitacoes'); // Redirect if not found or error
    } finally {
      setLoading(false);
    }
  }
  
  const formatFileSize = (bytes: number | null) => {
    if (bytes === null || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Carregando detalhes da licitação...</p></div>;
  }

  if (!licitacao) {
    return <div className="flex justify-center items-center h-screen"><p>Licitação não encontrada.</p></div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Licitações
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{licitacao.numero}</CardTitle>
              <CardDescription className="flex items-center text-md pt-1">
                <Landmark className="mr-1.5 h-5 w-5 text-muted-foreground" /> {licitacao.orgao}
              </CardDescription>
            </div>
            <span className={`px-3 py-1.5 text-sm rounded-full font-semibold ${
              licitacao.status === 'aberta' ? 'bg-green-100 text-green-800' : 
              licitacao.status === 'encerrada' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {licitacao.status.charAt(0).toUpperCase() + licitacao.status.slice(1)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Objeto da Licitação</h3>
            <p className="text-muted-foreground">{licitacao.objeto}</p>
          </div>
          
          {licitacao.descricao && (
            <div>
              <h3 className="font-semibold text-lg mb-1">Descrição Detalhada</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{licitacao.descricao}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4 text-primary" />
              <div>
                <span className="font-medium">Modalidade:</span> {licitacao.modalidade}
              </div>
            </div>
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 text-primary" />
              <div>
                <span className="font-medium">Data de Abertura:</span> {new Date(licitacao.data_abertura).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {licitacao.data_fechamento && (
              <div className="flex items-center">
                <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                <div>
                  <span className="font-medium">Data de Fechamento:</span> {new Date(licitacao.data_fechamento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
            {licitacao.valor_estimado && (
              <div className="flex items-center">
                <Tag className="mr-2 h-4 w-4 text-primary" />
                <div>
                  <span className="font-medium">Valor Estimado:</span> R$ {parseFloat(licitacao.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" /> Documentos da Licitação</CardTitle>
        </CardHeader>
        <CardContent>
          {documentos.length > 0 ? (
            <ul className="space-y-3">
              {documentos.map(doc => (
                <li key={doc.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                  <div className="flex items-center">
                    <Paperclip className="mr-3 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{doc.nome}</p>
                      <p className="text-xs text-muted-foreground">Tipo: {doc.tipo} {doc.tamanho ? `(${formatFileSize(doc.tamanho)})` : ''}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"> {/* Assuming doc.url is a direct download link */}
                      <Download className="mr-2 h-4 w-4" /> Baixar
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nenhum documento associado a esta licitação.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Propostas</CardTitle>
          <Button onClick={() => navigate(`/licitacoes/${id}/nova-proposta`)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Submeter Proposta
          </Button>
        </CardHeader>
        <CardContent>
          {propostas.length > 0 ? (
             <ul className="space-y-3">
              {propostas.map(prop => (
                <li key={prop.id} className="p-3 border rounded-md">
                  <p className="font-medium">Proposta ID: {prop.empresa_id} (Empresa/Usuário)</p> {/* Adjust to show company name if available */}
                  <p className="text-sm">Valor: R$ {parseFloat(prop.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground">Status: {prop.status} - Enviada em: {new Date(prop.data_envio).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nenhuma proposta submetida para esta licitação ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
