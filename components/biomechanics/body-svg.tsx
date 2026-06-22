'use client';

import { BASE_COLOR } from '@/lib/biomechanics/muscle-map';

interface BodySvgProps {
  getFill: (regionId: string) => string;
  className?: string;
}

const OUTLINE = '#1f2a24';
const SKIN = '#26322c';

interface FigureProps {
  getFill: (regionId: string) => string;
  title: string;
}

function FrontFigure({ getFill, title }: FigureProps) {
  return (
    <svg viewBox="0 0 120 300" className="h-full w-auto" role="img" aria-label={title}>
      <g stroke={OUTLINE} strokeWidth={1.2}>
        {/* head + neck + base silhouette */}
        <circle cx={60} cy={26} r={16} fill={SKIN} />
        <rect x={54} y={40} width={12} height={10} fill={SKIN} />
        <path
          d="M40 50 H80 L86 90 L82 150 H38 L34 90 Z"
          fill={SKIN}
        />
        {/* arms */}
        <path d="M40 52 L26 60 L20 120 L30 122 L38 70 Z" fill={SKIN} />
        <path d="M80 52 L94 60 L100 120 L90 122 L82 70 Z" fill={SKIN} />
        {/* legs */}
        <path d="M40 150 H58 L56 240 L48 296 H38 L42 240 Z" fill={SKIN} />
        <path d="M62 150 H80 L78 240 L82 296 H72 L64 240 Z" fill={SKIN} />

        {/* muscle regions */}
        <ellipse id="front-deltoides" cx={38} cy={58} rx={9} ry={8} fill={getFill('front-deltoides')} />
        <ellipse cx={82} cy={58} rx={9} ry={8} fill={getFill('front-deltoides')} />
        <path id="front-pectoral" d="M44 56 H60 V76 Q52 80 44 74 Z" fill={getFill('front-pectoral')} />
        <path d="M60 56 H76 V74 Q68 80 60 76 Z" fill={getFill('front-pectoral')} />
        <ellipse id="front-biceps" cx={29} cy={88} rx={6} ry={16} fill={getFill('front-biceps')} />
        <ellipse cx={91} cy={88} rx={6} ry={16} fill={getFill('front-biceps')} />
        <rect id="front-abdominales" x={49} y={84} width={22} height={42} rx={5} fill={getFill('front-abdominales')} />
        <path id="front-cuadriceps" d="M42 156 H57 L55 210 H45 Z" fill={getFill('front-cuadriceps')} />
        <path d="M63 156 H78 L75 210 H65 Z" fill={getFill('front-cuadriceps')} />
      </g>
    </svg>
  );
}

function BackFigure({ getFill, title }: FigureProps) {
  return (
    <svg viewBox="0 0 120 300" className="h-full w-auto" role="img" aria-label={title}>
      <g stroke={OUTLINE} strokeWidth={1.2}>
        <circle cx={60} cy={26} r={16} fill={SKIN} />
        <rect x={54} y={40} width={12} height={10} fill={SKIN} />
        <path d="M40 50 H80 L86 90 L82 150 H38 L34 90 Z" fill={SKIN} />
        <path d="M40 52 L26 60 L20 120 L30 122 L38 70 Z" fill={SKIN} />
        <path d="M80 52 L94 60 L100 120 L90 122 L82 70 Z" fill={SKIN} />
        <path d="M40 150 H58 L56 240 L48 296 H38 L42 240 Z" fill={SKIN} />
        <path d="M62 150 H80 L78 240 L82 296 H72 L64 240 Z" fill={SKIN} />

        {/* muscle regions (posterior) */}
        <path id="back-trapecio" d="M48 50 H72 L66 70 H54 Z" fill={getFill('back-trapecio')} />
        <ellipse id="back-deltoides" cx={38} cy={58} rx={9} ry={8} fill={getFill('back-deltoides')} />
        <ellipse cx={82} cy={58} rx={9} ry={8} fill={getFill('back-deltoides')} />
        <path id="back-dorsales" d="M44 70 H58 L56 104 Q50 108 45 102 Z" fill={getFill('back-dorsales')} />
        <path d="M62 70 H76 L75 102 Q70 108 64 104 Z" fill={getFill('back-dorsales')} />
        <ellipse id="back-triceps" cx={29} cy={88} rx={6} ry={16} fill={getFill('back-triceps')} />
        <ellipse cx={91} cy={88} rx={6} ry={16} fill={getFill('back-triceps')} />
        <rect id="back-erectores" x={54} y={104} width={12} height={26} rx={3} fill={getFill('back-erectores')} />
        <path id="back-gluteos" d="M44 132 H59 V150 H44 Z" fill={getFill('back-gluteos')} />
        <path d="M61 132 H76 V150 H61 Z" fill={getFill('back-gluteos')} />
        <path id="back-isquios" d="M42 156 H57 L55 206 H45 Z" fill={getFill('back-isquios')} />
        <path d="M63 156 H78 L75 206 H65 Z" fill={getFill('back-isquios')} />
        <ellipse id="back-gemelos" cx={49} cy={250} rx={6} ry={18} fill={getFill('back-gemelos')} />
        <ellipse cx={73} cy={250} rx={6} ry={18} fill={getFill('back-gemelos')} />
      </g>
    </svg>
  );
}

export function BodySvg({ getFill, className }: BodySvgProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}
    >
      <FrontFigure getFill={getFill} title="Vista frontal" />
      <BackFigure getFill={getFill} title="Vista posterior" />
    </div>
  );
}

export { BASE_COLOR };
