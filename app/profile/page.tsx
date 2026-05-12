'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Calendar } from 'lucide-react';

function ProfileContent() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12 space-y-2">
            <h1 className="text-5xl font-bold tracking-tight">Mi Perfil</h1>
            <p className="text-lg text-muted-foreground">Administra tu información personal</p>
          </div>

          <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-8 backdrop-blur-sm space-y-8">
            {/* Profile Header */}
            <div className="flex items-center gap-6 pb-8 border-b border-border">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                {user?.first_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Información Personal</h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                    <User className="h-4 w-4 text-primary" />
                    Nombre
                  </label>
                  <Input
                    type="text"
                    value={user?.first_name || ''}
                    readOnly
                    className="h-11 bg-background/50 border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                    <User className="h-4 w-4 text-secondary" />
                    Apellido
                  </label>
                  <Input
                    type="text"
                    value={user?.last_name || ''}
                    readOnly
                    className="h-11 bg-background/50 border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Mail className="h-4 w-4 text-accent" />
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="h-11 bg-background/50 border-border text-foreground"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="border-t border-border pt-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Estadísticas</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4 border border-secondary/20">
                  <p className="text-sm text-muted-foreground mb-2">Entrenamientos completados</p>
                  <p className="text-3xl font-bold text-foreground">28</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 border border-orange-500/20">
                  <p className="text-sm text-muted-foreground mb-2">Calorías quemadas</p>
                  <p className="text-3xl font-bold text-foreground">8,420</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-8 space-y-4">
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg">
                Editar Perfil
              </Button>
              <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary/10">
                Cambiar Contraseña
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
