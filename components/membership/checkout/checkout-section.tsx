'use client';

export function CheckoutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="gp-module rounded-xl p-4">
      <h3 className="gp-mono mb-3 text-xs uppercase gp-text-dim">{title}</h3>
      {children}
    </div>
  );
}
