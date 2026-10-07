import { BarChart3, LayoutDashboard, Trophy, Users } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { adminApi } from '@/services/api';
import { formatMoney } from '@/lib/utils';

const COLORS = ['#1473FF','#3D96FF','#22C55E','#F59E0B','#EF4444','#8B5CF6'];

export function AdminDashboard() {
  return <RequireAuth permission="dashboard.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { data, loading } = useAsync(() => adminApi.stats(), []);
  if (loading || !data) return <div className="p-12 text-center text-ink-faint">Loading...</div>;

  return <div>
    <PageHeader title="Admin Dashboard" subtitle="Platform overview"/>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Users} label="Total users" value={data.users}/>
      <StatCard icon={Users} label="Active users" value={data.activeUsers} tone="success"/>
      <StatCard icon={Trophy} label="Tournaments" value={data.tournaments}/>
      <StatCard icon={Trophy} label="Live" value={data.liveTournaments} tone="danger"/>
      <StatCard icon={LayoutDashboard} label="Teams" value={data.teams}/>
      <StatCard icon={Users} label="Organizers" value={data.organizers} tone="warning"/>
      <StatCard icon={Users} label="Hosts" value={data.hosts}/>
      <StatCard icon={BarChart3} label="Prize pool" value={data.prizePool} tone="warning"/>
    </div>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Role distribution</CardTitle></CardHeader>
        <CardBody className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.roleDistribution} dataKey="value" nameKey="name" outerRadius={80}>
                {data.roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'#0B1324', border:'1px solid #16233C', borderRadius:12 }}/>
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
        <CardBody className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name:'Live', v:data.liveTournaments },
              { name:'Finished', v:data.finishedTournaments },
              { name:'Matches', v:data.matches }
            ]}>
              <CartesianGrid stroke="#16233C" strokeDasharray="3 3"/>
              <XAxis dataKey="name" stroke="#64748B" fontSize={12}/>
              <YAxis stroke="#64748B" fontSize={12}/>
              <Tooltip contentStyle={{ background:'#0B1324', border:'1px solid #16233C', borderRadius:12 }}/>
              <Bar dataKey="v" fill="#1473FF" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
    <Card className="mt-6">
      <CardHeader><CardTitle>Total prize money</CardTitle></CardHeader>
      <CardBody>
        <p className="font-display text-3xl font-bold text-white">{formatMoney(data.prizePool)}</p>
        <p className="text-xs text-ink-faint">across {data.tournaments} tournaments</p>
      </CardBody>
    </Card>
  </div>;
}