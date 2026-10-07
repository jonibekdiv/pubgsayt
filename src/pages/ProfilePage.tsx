import { Mail, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';
import { formatDate } from '@/lib/utils';

export function ProfilePage() {
  const { user } = useAuth();
  const { data: team } = useAsync(() => user ? teamApi.byUser(user.id) : Promise.resolve(undefined), [user?.id]);

  if (!user) return <div className="p-12 text-center text-ink-faint">Please login</div>;

  return <div>
    <PageHeader title="Profile" subtitle="Your player identity"/>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardBody className="pt-6 text-center">
          <Avatar src={user.avatar} name={user.fullName} size={96} className="mx-auto" ring/>
          <h2 className="mt-4 font-display text-xl font-bold text-white">{user.fullName}</h2>
          <p className="text-xs text-ink-faint">@{user.username}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1">
            {user.roles.map(r => (
              <span key={r} className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-400">
                {r}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardBody className="space-y-3 text-sm">
          <Row icon={Mail} label="Email" value={user.email}/>
          <Row icon={Phone} label="Phone" value={user.phone ?? '-'}/>
          <Row icon={MapPin} label="Location" value={[user.city, user.country].filter(Boolean).join(', ') || '-'}/>
          <div className="grid grid-cols-2 gap-4 pt-3">
            <Info label="PUBG nickname" value={user.pubgNickname ?? '-'}/>
            <Info label="PUBG ID" value={user.pubgId ?? '-'}/>
            <Info label="Joined" value={formatDate(user.createdAt)}/>
            <Info label="Current team" value={team?.name ?? 'No team'}/>
          </div>
        </CardBody>
      </Card>
    </div>
  </div>;
}

function Row({ icon:Icon, label, value }: { icon:typeof Mail; label:string; value:string }) {
  return <div className="flex items-center gap-3 border-b border-line pb-3 last:border-0">
    <Icon size={15} className="text-ink-faint"/>
    <span className="w-32 shrink-0 text-xs uppercase tracking-wider text-ink-faint">{label}</span>
    <span className="truncate text-white">{value}</span>
  </div>;
}

function Info({ label, value }: { label:string; value:string }) {
  return <div>
    <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
    <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
  </div>;
}