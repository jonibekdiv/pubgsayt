import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Map, Trophy, Users } from 'lucide-react';
import type { Tournament } from '@/types';
import { StatusBadge } from '@/components/ui/badge';
import { MAP_LABEL, formatDate, formatMoney } from '@/lib/utils';

export function TournamentCard({ tournament: t }: { tournament:Tournament }) {
  return <motion.div whileHover={{ y:-4 }} transition={{ type:'spring', stiffness:400, damping:28 }}>
    <Link to={'/tournaments/' + t.id} className="group block surface overflow-hidden transition-colors hover:border-brand-600/40">
      <div className="relative h-36 overflow-hidden bg-bg-deep">
        {t.banner && <img src={t.banner} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-panel via-bg-panel/40 to-transparent"/>
        <div className="absolute left-3 top-3"><StatusBadge status={t.status}/></div>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3">
          {t.logo && <img src={t.logo} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-line bg-bg-deep object-cover"/>}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold uppercase tracking-wide text-white">{t.name}</p>
            <p className="text-xs text-ink-faint">{t.shortName}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><Trophy size={13} className="text-brand-400"/> {formatMoney(t.prizePool)}</span>
          <span className="flex items-center gap-1.5"><Calendar size={13} className="text-brand-400"/> {formatDate(t.startDate)}</span>
          <span className="flex items-center gap-1.5"><Users size={13} className="text-brand-400"/> {t.maxTeams} teams</span>
          <span className="flex items-center gap-1.5 truncate"><Map size={13} className="text-brand-400"/> {t.maps.slice(0,2).map(m => MAP_LABEL[m]).join(', ')}</span>
        </div>
      </div>
    </Link>
  </motion.div>;
}