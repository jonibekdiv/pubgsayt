import { BarChart3, Gauge, LayoutDashboard, ListOrdered, Radio, ScrollText, Settings, Shield, Swords, Trophy, User, UserCog, Users, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem { label:string; to:string; icon:LucideIcon; permission?:string; exact?:boolean }

export const PLAYER_NAV: NavItem[] = [
  { label:'Dashboard', to:'/dashboard', icon:LayoutDashboard, permission:'dashboard.view' },
  { label:'Tournaments', to:'/tournaments', icon:Trophy, permission:'tournaments.view' },
  { label:'Live', to:'/live', icon:Radio },
  { label:'Teams', to:'/teams', icon:Users },
  { label:'Leaderboard', to:'/leaderboard', icon:ListOrdered, permission:'leaderboard.view' },
  { label:'My Team', to:'/my-team', icon:Swords },
  { label:'Wallet', to:'/wallet', icon:Wallet },
  { label:'Profile', to:'/profile', icon:User }
];

export const ORGANIZER_NAV: NavItem[] = [
  { label:'Overview', to:'/organizer', icon:Gauge, permission:'dashboard.view', exact:true },
  { label:'Tournaments', to:'/organizer/tournaments', icon:Trophy, permission:'tournaments.view' },
  { label:'Hosts', to:'/organizer/hosts', icon:UserCog, permission:'hosts.manage' }
];

export const HOST_NAV: NavItem[] = [
  { label:'Overview', to:'/host', icon:Gauge, permission:'dashboard.view', exact:true },
  { label:'Assigned', to:'/host/tournaments', icon:Trophy, permission:'tournaments.view' }
];

export const ADMIN_NAV: NavItem[] = [
  { label:'Dashboard', to:'/admin', icon:LayoutDashboard, permission:'dashboard.view', exact:true },
  { label:'Users', to:'/admin/users', icon:Users, permission:'users.view' },
  { label:'Roles', to:'/admin/roles', icon:Shield, permission:'roles.view' },
  { label:'Organizers', to:'/admin/organizers', icon:UserCog, permission:'organizer.approve' },
  { label:'Top-ups', to:'/admin/topup-requests', icon:Wallet, permission:'users.view' },
  { label:'Payment Settings', to:'/admin/payment-settings', icon:Settings, permission:'settings.manage' },
  { label:'Tournaments', to:'/admin/tournaments', icon:Trophy, permission:'tournaments.view' },
  { label:'Statistics', to:'/admin/statistics', icon:BarChart3, permission:'statistics.view' },
  { label:'Audit Logs', to:'/admin/audit-logs', icon:ScrollText, permission:'audit.view' },
  { label:'Settings', to:'/admin/settings', icon:Settings, permission:'settings.manage' }
];