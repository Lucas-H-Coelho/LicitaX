import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] text-center px-4">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Página Não Encontrada
      </h2>
      <p className="mt-3 text-lg text-muted-foreground">
        Oops! Parece que a página que você está procurando não existe ou foi movida.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          Voltar para o Início
        </Link>
      </Button>
    </div>
  );
}
