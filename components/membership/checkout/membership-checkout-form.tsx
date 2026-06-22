'use client';

import { useAuth } from '@/app/context/auth-context';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { CheckoutSection } from '@/components/membership/checkout/checkout-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePaymentCheckout } from '@/hooks/use-payment-checkout';
import type { MembershipPlan } from '@/hooks/use-memberships';
import { COUNTRY_OPTIONS } from '@/lib/constants/countries';
import { formatCurrency } from '@/lib/payments/format-currency';
import { getPaymentMethodInstructions, submitPaymentRequest } from '@/lib/data/client';
import { isApiMembershipsSource } from '@/lib/api/config';
import { cn } from '@/lib/utils';
import {
  CreditCard,
  Mail,
  Phone,
  Shield,
  Upload,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/gif,application/pdf';

type MembershipCheckoutFormProps = {
  plan: MembershipPlan;
  onBack: () => void;
  onSuccess: () => void;
};

export function MembershipCheckoutForm({ plan, onBack, onSuccess }: MembershipCheckoutFormProps) {
  const { user, refreshSession } = useAuth();
  const { methods, pendingRequest, isLoading, refresh } = usePaymentCheckout(user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [sellerCode, setSellerCode] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedMethod = methods.find((method) => method.id === paymentMethodId);
  const quote = selectedMethod?.exchangeRate
    ? {
        usd: Number(plan.price || 0),
        converted: Number(plan.price || 0) * selectedMethod.exchangeRate.rate,
        currency: selectedMethod.exchangeRate.toCurrency,
        rate: selectedMethod.exchangeRate.rate,
      }
    : null;

  useEffect(() => {
    if (!user) return;
    setFullName(`${user.first_name} ${user.last_name}`.trim());
    setEmail(user.email);
  }, [user]);

  useEffect(() => {
    if (!paymentMethodId) {
      setInstructions('');
      return;
    }
    if (!isApiMembershipsSource()) {
      const method = methods.find((m) => m.id === paymentMethodId);
      setInstructions(method?.instructions ?? '');
      return;
    }
    void getPaymentMethodInstructions(paymentMethodId)
      .then((m) => setInstructions(m.instructions ?? ''))
      .catch(() => setInstructions(''));
  }, [paymentMethodId, methods]);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('El archivo supera el máximo de 5MB');
      return;
    }
    setError(null);
    setReceipt(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !phone.trim() || !country || !email.trim() || !paymentMethodId) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    if (!receipt) {
      setError('Debes subir el comprobante de pago');
      return;
    }
    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setSubmitting(true);
    try {
      await submitPaymentRequest({
        planId: plan.id,
        paymentMethodId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        country,
        sellerCode: sellerCode.trim() || undefined,
        email: email.trim(),
        amountUsd: Number(plan.price || 0),
        amountConverted: quote ? Number(quote.converted.toFixed(2)) : undefined,
        convertedCurrency: quote?.currency,
        exchangeRateSnapshot: quote?.rate,
        receipt,
      });
      await refresh();
      if (isApiMembershipsSource()) {
        await refreshSession();
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (pendingRequest) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-[#d4a853]/50 bg-[#faf6ee] p-8 text-center">
        <Shield className="mx-auto size-12 text-[#d4a853]" aria-hidden />
        <h2 className="text-xl font-bold text-[#1a1f2e]">Tu pago está en revisión</h2>
        <p className="text-sm text-[#5c6478]">
          Recibimos tu solicitud para el plan <strong>{pendingRequest.planName || plan.name}</strong>.
          Un administrador validará tu comprobante pronto.
        </p>
        <PrimeChamferButton type="button" className="w-full" onClick={onBack}>
          Volver a planes
        </PrimeChamferButton>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-2xl space-y-5">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl border gp-border-outline gp-bg-surface-high">
          <User className="size-6 gp-text-phosphor" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-bold gp-text-primary">Checkout membresía</h2>
          <p className="flex items-center gap-1 text-sm gp-text-muted">
            <Shield className="size-3.5" aria-hidden />
            Plan: {Number(plan.price || 0).toFixed(2)} USD
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <CheckoutSection title="Datos personales">
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="gp-mono uppercase gp-text-dim">
              Nombre Completo *
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez"
              className="mt-1 gp-field"
              required
            />
          </div>
          <div>
            <Label htmlFor="sellerCode" className="gp-mono uppercase gp-text-dim">
              Código de vendedor (opcional)
            </Label>
            <Input
              id="sellerCode"
              value={sellerCode}
              onChange={(e) => setSellerCode(e.target.value)}
              placeholder="Si te refirió un vendedor"
              className="mt-1 gp-field"
            />
          </div>
        </div>
      </CheckoutSection>

      <CheckoutSection title="Información de contacto">
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone" className="text-[#1a1f2e]">
              Teléfono *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+58 414 1234567"
              className="mt-1 border-[#e8dcc8] bg-white"
              required
            />
          </div>
          <div>
            <Label className="text-[#1a1f2e]">País/Región *</Label>
            <Select value={country} onValueChange={setCountry} required>
              <SelectTrigger className="mt-1 border-[#e8dcc8] bg-white">
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CheckoutSection>

      <CheckoutSection title="Correo electrónico">
        <div>
          <Label htmlFor="email" className="text-[#1a1f2e]">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@ejemplo.com"
            className="mt-1 border-[#e8dcc8] bg-white"
            required
          />
        </div>
      </CheckoutSection>

      <CheckoutSection title="Método de pago">
        <p className="mb-3 text-sm text-[#5c6478]">Selecciona tu método de pago *</p>
        {isLoading ? (
          <p className="text-sm text-[#5c6478]">Cargando métodos…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {methods.map((method) => {
              const selected = paymentMethodId === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethodId(method.id)}
                  className={cn(
                    'rounded-xl border-2 p-4 text-left transition-colors',
                    selected
                      ? 'border-[var(--gp-phosphor)] bg-[#0d2017]'
                      : 'gp-border-outline gp-bg-surface-high hover:border-[var(--gp-phosphor)]/60',
                  )}
                >
                  <div className="mb-2 flex size-8 items-center justify-center rounded-lg gp-bg-surface-variant">
                    <CreditCard className="size-4 gp-text-phosphor" aria-hidden />
                  </div>
                  <p className="font-bold gp-text-primary">{method.name}</p>
                  <p className="text-xs gp-text-muted">{method.category}</p>
                </button>
              );
            })}
          </div>
        )}
        {instructions && (
          <div className="mt-4 rounded-lg border gp-border-outline gp-bg-surface-high p-3 text-sm gp-text-muted whitespace-pre-wrap">
            {instructions}
          </div>
        )}
        {selectedMethod?.details?.length ? (
          <div className="mt-3 space-y-1 text-sm gp-text-muted">
            {selectedMethod.details.map((item, idx) => (
              <p key={idx}><span className="gp-mono uppercase gp-text-dim">{item.key}:</span> {item.value}</p>
            ))}
          </div>
        ) : null}
      </CheckoutSection>

      {quote ? (
        <div className="rounded-xl border border-[var(--gp-phosphor)] p-4">
          <p className="gp-mono text-xs uppercase gp-text-dim">Monto a transferir</p>
          <p className="mt-1 text-2xl font-bold gp-text-phosphor">
            {formatCurrency(quote.converted, quote.currency)}
          </p>
          <p className="text-sm gp-text-muted">
            Tasa: 1 USD = {quote.rate.toFixed(2)} {quote.currency}
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border gp-border-outline gp-bg-surface-high p-5">
        <div className="mb-3 flex items-center gap-2 text-white">
          <Upload className="size-5" aria-hidden />
          <h3 className="font-bold gp-text-primary">Comprobante de Pago</h3>
        </div>
        <div
          className="rounded-xl border-2 border-dashed border-white/60 bg-white/95 p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0] ?? null);
          }}
        >
          <p className="font-semibold gp-text-primary">Sube tu Comprobante</p>
          <p className="mt-1 text-sm gp-text-muted">
            Arrastra tu archivo aquí o haz clic para seleccionar
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--gp-phosphor)] px-5 py-2.5 text-sm font-semibold text-[#003906] hover:bg-[var(--gp-phosphor-bright)]"
          >
            <Upload className="size-4" aria-hidden />
            Seleccionar Archivo
          </button>
          {receipt && (
            <p className="mt-3 text-sm font-medium text-[#1a1f2e]">{receipt.name}</p>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs gp-text-muted">
            <span>Formatos: JPG, PNG, GIF, PDF</span>
            <span>5MB Máximo</span>
          </div>
        </div>
        <div className="mt-4 rounded-lg gp-bg-surface-variant p-3 text-sm gp-text-muted">
          <p className="flex items-center gap-1 font-semibold">
            <Shield className="size-4" aria-hidden /> Información importante
          </p>
          <p className="mt-1">Imagen clara y legible</p>
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-[#5c6478]">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1"
        />
        <span>
          Acepto los{' '}
          <Link href="/terms" className="font-medium gp-text-phosphor hover:underline">
            términos y condiciones
          </Link>{' '}
          y el tratamiento de mis datos personales
        </span>
      </label>

      <div className="flex gap-3">
        <PrimeChamferButton type="button" className="flex-1 opacity-80" onClick={onBack}>
          Volver
        </PrimeChamferButton>
        <PrimeChamferButton type="submit" disabled={submitting} className="flex-1">
          Confirmar compra ({Number(plan.price || 0).toFixed(2)} USD)
        </PrimeChamferButton>
      </div>
    </form>
  );
}
