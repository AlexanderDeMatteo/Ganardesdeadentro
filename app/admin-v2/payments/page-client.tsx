'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import type { PaymentRequest } from '@/lib/api/contracts/payments';
import { getApiBaseUrl } from '@/lib/api/config';
import { getAccessToken } from '@/lib/auth/session-store';
import { cn } from '@/lib/utils';
import { Check, X, Eye, ZoomIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function statusClass(status: PaymentRequest['status']) {
  if (status === 'pending') return 'text-[#f2b84b]';
  if (status === 'approved') return 'gp-text-phosphor';
  return 'text-[var(--gp-error)]';
}

function ReceiptViewer({ request }: { request: PaymentRequest }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isImage = request.receiptMime.startsWith('image/');

  useEffect(() => {
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewOpen(false);
  }, [request.id]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const loadReceipt = async () => {
    if (!request.receiptUrl) return;
    if (blobUrl) {
      if (isImage) setPreviewOpen(true);
      return;
    }
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${getApiBaseUrl()}${request.receiptUrl}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        toast.error('No se pudo cargar el comprobante');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      if (isImage) setPreviewOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <PrimeChamferButton
        type="button"
        className="text-xs"
        disabled={loading}
        onClick={() => void loadReceipt()}
      >
        <Eye className="size-3" aria-hidden />
        {loading ? 'Cargando…' : blobUrl && isImage ? 'Ampliar comprobante' : 'Ver comprobante'}
      </PrimeChamferButton>
      {blobUrl && isImage && (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="group relative block w-full overflow-hidden rounded-lg border gp-border-outline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blobUrl}
            alt="Comprobante de pago"
            className="max-h-48 w-full cursor-zoom-in object-contain transition-opacity group-hover:opacity-90"
          />
          <span className="gp-mono absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[10px] uppercase gp-text-phosphor">
            <ZoomIn className="size-3" aria-hidden />
            Ampliar
          </span>
        </button>
      )}
      {blobUrl && !isImage && (
        <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="text-sm gp-text-phosphor underline">
          Abrir PDF
        </a>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl border gp-border-outline gp-bg-surface-high p-4 sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="gp-mono text-sm uppercase gp-text-primary">
              Comprobante de pago
            </DialogTitle>
          </DialogHeader>
          {blobUrl && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobUrl}
              alt="Comprobante de pago ampliado"
              className="max-h-[80vh] w-full object-contain"
            />
          ) : null}
          {blobUrl ? (
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-mono text-xs gp-text-phosphor underline"
            >
              Abrir en nueva pestaña
            </a>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminV2PaymentsPage() {
  const [filter, setFilter] = useState<string>('pending');
  const { requests, isLoading, approve, reject } = usePaymentRequests(filter || undefined);
  const [selected, setSelected] = useState<PaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'pending').length,
    [requests],
  );

  const handleApprove = async (id: string) => {
    setBusy(true);
    try {
      await approve(id);
      toast.success('Pago aprobado y membresía activada');
      setSelected(null);
    } catch {
      toast.error('No se pudo aprobar');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id: string) => {
    setBusy(true);
    try {
      await reject(id, rejectReason || undefined);
      toast.success('Solicitud rechazada');
      setSelected(null);
      setRejectReason('');
    } catch {
      toast.error('No se pudo rechazar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Validación de Pagos"
        subtitle={`${pendingCount} solicitud(es) en esta vista`}
      />

      <div className="flex flex-wrap gap-2">
        {['pending', 'approved', 'rejected', ''].map((value) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              'gp-mono rounded-full px-4 py-1.5 text-xs font-bold uppercase',
              filter === value ? 'bg-[var(--gp-phosphor)] text-[#003906]' : 'gp-bg-surface-variant gp-text-muted',
            )}
          >
            {value === '' ? 'Todos' : value}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PrimeModule modId="PQ" title="COLA" className="lg:col-span-2 overflow-hidden">
          {isLoading ? (
            <Skeleton className="m-4 h-48" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="gp-mono border-b gp-border-outline text-xs uppercase gp-text-muted">
                    <th className="p-3">Atleta</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">USD</th>
                    <th className="p-3">Convertido</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className={cn(
                        'cursor-pointer border-b gp-border-outline/50 hover:bg-[#2e3732]/30',
                        selected?.id === req.id && 'bg-[#2e3732]/40',
                      )}
                      onClick={() => setSelected(req)}
                    >
                      <td className="p-3">{req.athleteName || req.fullName}</td>
                      <td className="p-3">{req.planName}</td>
                      <td className="p-3">${(req.amountUsd ?? req.amount).toFixed(2)}</td>
                      <td className="p-3">
                        {req.amountConverted != null && req.convertedCurrency
                          ? `${req.amountConverted.toFixed(2)} ${req.convertedCurrency}`
                          : '-'}
                      </td>
                      <td className={cn('p-3 font-medium uppercase', statusClass(req.status))}>
                        {req.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PrimeModule>

        <PrimeModule modId="DET" title="DETALLE">
          {selected ? (
            <div className="space-y-3 p-4 text-sm">
              <p><strong>Nombre:</strong> {selected.fullName}</p>
              <p><strong>Email:</strong> {selected.email}</p>
              <p><strong>Teléfono:</strong> {selected.phone}</p>
              <p><strong>País:</strong> {selected.country}</p>
              {selected.sellerCode && <p><strong>Vendedor:</strong> {selected.sellerCode}</p>}
              <p><strong>Método:</strong> {selected.paymentMethodName}</p>
              <p><strong>Plan:</strong> {selected.planName}</p>
              <p><strong>Monto USD:</strong> ${(selected.amountUsd ?? selected.amount).toFixed(2)}</p>
              {selected.amountConverted != null && selected.convertedCurrency ? (
                <p><strong>Monto convertido:</strong> {selected.amountConverted.toFixed(2)} {selected.convertedCurrency}</p>
              ) : null}
              {selected.exchangeRateSnapshot != null ? (
                <p><strong>Tasa snapshot:</strong> {selected.exchangeRateSnapshot.toFixed(2)}</p>
              ) : null}
              <ReceiptViewer request={selected} />
              {selected.status === 'pending' && (
                <div className="space-y-2 pt-2">
                  <textarea
                    className="w-full rounded border gp-border-outline bg-transparent p-2 text-xs"
                    placeholder="Motivo de rechazo (opcional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <PrimeChamferButton
                      type="button"
                      disabled={busy}
                      onClick={() => void handleApprove(selected.id)}
                    >
                      <Check className="size-4" aria-hidden />
                      Aprobar (30 días)
                    </PrimeChamferButton>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleReject(selected.id)}
                      className="gp-mono inline-flex items-center gap-1 rounded px-3 py-2 text-xs text-[var(--gp-error)]"
                    >
                      <X className="size-3" aria-hidden />
                      Rechazar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="p-4 text-sm gp-text-muted">Selecciona una solicitud</p>
          )}
        </PrimeModule>
      </div>
    </div>
  );
}
