import { useLoadingStore } from '@/stores/loadingStore';
import { Loader2 } from 'lucide-react';

export function ApiStatusIndicator() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  if (!isLoading) {
    return null; // Não renderiza nada quando não está carregando para manter a UI limpa
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite" aria-busy="true">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <span className="hidden sm:inline">Carregando...</span> {/* Texto visível em telas sm e maiores */}
    </div>
  );
}
