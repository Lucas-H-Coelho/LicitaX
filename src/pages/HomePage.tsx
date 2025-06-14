import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CheckCircle, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-16">
        <div className="inline-flex items-center justify-center bg-primary text-primary-foreground p-4 rounded-full mb-6">
          <Briefcase size={48} />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-primary">Bem-vindo ao LicitaX</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Sua plataforma inteligente para encontrar, analisar e gerenciar licitações públicas com eficiência e precisão.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
              <Search size={32} />
            </div>
            <CardTitle>Busca Avançada</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Encontre as melhores oportunidades com filtros poderosos e alertas personalizados.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
              <CheckCircle size={32} />
            </div>
            <CardTitle>Gestão Simplificada</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Organize suas licitações, propostas e documentos em um só lugar.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
              <Users size={32} />
            </div>
            <CardTitle>Colaboração Eficaz</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Trabalhe em equipe, compartilhe informações e aumente suas chances de sucesso.
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      <section className="bg-muted/50 p-8 rounded-lg text-center mb-16">
        <h2 className="text-3xl font-semibold mb-4">Pronto para começar?</h2>
        <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
          Junte-se a centenas de empresas que já estão transformando sua participação em licitações com o LicitaX.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/signup')}>Criar Conta Gratuitamente</Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/login')}>Acessar Minha Conta</Button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold text-center mb-8">O que nossos clientes dizem</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="pt-6">
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                "O LicitaX revolucionou a forma como encontramos e gerenciamos licitações. Economizamos tempo e ganhamos muito mais editais!"
              </blockquote>
              <p className="mt-4 font-semibold">- João Silva, Diretor Comercial</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                "A interface é intuitiva e os recursos de análise são incríveis. Recomendo fortemente o LicitaX para qualquer empresa que participe de licitações."
              </blockquote>
              <p className="mt-4 font-semibold">- Maria Oliveira, Gerente de Contratos</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
