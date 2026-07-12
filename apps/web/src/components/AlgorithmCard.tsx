import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, Star } from 'lucide-react';
import type { Algorithm } from '../api';

interface AlgorithmCardProps {
  algorithm: Algorithm;
  index?: number;
}

function getBurstBadge(burstTolerance: string) {
  switch (burstTolerance) {
    case 'Excellent':
      return <span className="badge badge-success">Burst: Excellent</span>;
    case 'None':
      return <span className="badge badge-danger">No Bursts</span>;
    case 'Boundary spikes':
      return <span className="badge badge-warning">Boundary Spikes</span>;
    case 'Natural':
      return <span className="badge badge-accent">Natural</span>;
    case 'Smoothed':
      return <span className="badge badge-success">Smoothed</span>;
    default:
      return <span className="badge badge-accent">{burstTolerance}</span>;
  }
}

export function AlgorithmCard({ algorithm, index = 0 }: AlgorithmCardProps) {
  return (
    <Link
      to={`/algorithms/${algorithm.slug}`}
      className={`glass-card block p-5 no-underline animate-fade-in-up opacity-0 stagger-${index + 1}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
            <Cpu size={16} className="text-accent" />
          </div>
          <h3 className="text-base font-semibold text-text-primary m-0">
            {algorithm.name}
          </h3>
        </div>
        {algorithm.recommended && (
          <div className="flex items-center gap-1 text-warning text-xs font-semibold">
            <Star size={12} fill="currentColor" />
            Recommended
          </div>
        )}
      </div>

      <p className="text-text-secondary text-sm leading-relaxed mb-4 m-0">
        {algorithm.description}
      </p>

      <div className="flex items-center flex-wrap gap-2 mb-4">
        <span className="badge badge-accent">{algorithm.complexity}</span>
        <span className="badge badge-accent">{algorithm.category}</span>
        {getBurstBadge(algorithm.burstTolerance)}
      </div>

      <div className="flex items-center text-accent text-sm font-medium group/link">
        View details
        <ArrowRight size={14} className="ml-1 transition-transform group-hover/link:translate-x-1" />
      </div>
    </Link>
  );
}
