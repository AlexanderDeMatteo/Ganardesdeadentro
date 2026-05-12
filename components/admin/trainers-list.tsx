'use client';

import { Trainer } from '@/hooks/use-admin';
import { Star, Users, Calendar } from 'lucide-react';

interface TrainersListProps {
  trainers: Trainer[];
}

export function TrainersList({ trainers }: TrainersListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {trainers.map((trainer) => (
        <div
          key={trainer.id}
          className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm hover:border-secondary/40 hover:shadow-lg transition-all duration-300"
        >
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-foreground">{trainer.name}</h3>
              <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-3 py-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-semibold">{trainer.rating}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{trainer.specialization}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" />
              <span className="text-sm">
                <span className="font-semibold">{trainer.athletes}</span> atletas asignados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Desde {new Date(trainer.joinDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-secondary/20">
            <p className="text-xs text-muted-foreground">{trainer.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
