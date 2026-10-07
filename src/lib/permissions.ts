import type { Role, RoleKey } from '@/types';

export const PERMISSION_CATALOG = [
  { group:'Dashboard', items:[{ key:'dashboard.view', label:'View dashboard' }] },
  { group:'Users', items:[
    { key:'users.view', label:'View' },{ key:'users.create', label:'Create' },
    { key:'users.edit', label:'Edit' },{ key:'users.delete', label:'Delete' },{ key:'users.ban', label:'Ban' }]},
  { group:'Roles', items:[
    { key:'roles.view', label:'View' },{ key:'roles.create', label:'Create' },
    { key:'roles.edit', label:'Edit' },{ key:'roles.delete', label:'Delete' }]},
  { group:'Tournaments', items:[
    { key:'tournaments.view', label:'View' },{ key:'tournaments.create', label:'Create' },
    { key:'tournaments.edit', label:'Edit' },{ key:'tournaments.delete', label:'Delete' },
    { key:'tournaments.publish', label:'Publish' },{ key:'tournaments.start', label:'Start' },
    { key:'tournaments.stop', label:'Stop' },{ key:'tournaments.register', label:'Register' }]},
  { group:'Teams', items:[
    { key:'teams.create', label:'Create' },{ key:'teams.edit', label:'Edit' },
    { key:'teams.delete', label:'Delete' },{ key:'teams.manage_members', label:'Manage members' },
    { key:'teams.register_tournament', label:'Register tournament' }]},
  { group:'Organizers & Hosts', items:[
    { key:'organizer.apply', label:'Apply' },{ key:'organizer.approve', label:'Approve' },
    { key:'hosts.assign', label:'Assign' },{ key:'hosts.manage', label:'Manage' }]},
  { group:'Matches & Scores', items:[
    { key:'matches.create', label:'Create' },{ key:'matches.edit', label:'Edit' },
    { key:'scores.enter', label:'Enter' },{ key:'scores.edit', label:'Edit' },
    { key:'leaderboard.view', label:'View leaderboard' }]},
  { group:'Platform', items:[
    { key:'stream.manage', label:'Streams' },{ key:'statistics.view', label:'Stats' },
    { key:'settings.manage', label:'Settings' },{ key:'audit.view', label:'Audit' }]},
] as const;

const ALL = PERMISSION_CATALOG.flatMap(g => g.items.map(i => i.key)) as string[];

export const SYSTEM_ROLES: Record<string,{ name:string; description:string; permissions:string[] }> = {
  SUPERADMIN: { name:'Superadmin', description:'Unrestricted', permissions:ALL },
  ADMIN: { name:'Admin', description:'Administration',
    permissions: ALL.filter(p => !['roles.delete','settings.manage'].includes(p)) },
  ORGANIZER: { name:'Organizer', description:'Manages own tournaments', permissions:[
    'dashboard.view','tournaments.view','tournaments.create','tournaments.edit','tournaments.publish',
    'tournaments.start','tournaments.stop','matches.create','matches.edit','scores.enter','scores.edit',
    'hosts.assign','hosts.manage','stream.manage','leaderboard.view','teams.manage_members','statistics.view'] },
  HOST: { name:'Host', description:'Runs matches', permissions:[
    'dashboard.view','tournaments.view','matches.edit','scores.enter','leaderboard.view'] },
  TEAM_CAPTAIN: { name:'Team Captain', description:'Manages team', permissions:[
    'dashboard.view','tournaments.view','tournaments.register','teams.create','teams.edit',
    'teams.manage_members','teams.register_tournament','leaderboard.view','organizer.apply'] },
  PLAYER: { name:'Player', description:'Plays', permissions:[
    'dashboard.view','tournaments.view','leaderboard.view','teams.create','organizer.apply'] },
};

export const can = (perms: string[] | undefined, needed: string | string[]): boolean => {
  if (!perms?.length) return false;
  if (perms.includes('*')) return true;
  const list = Array.isArray(needed) ? needed : [needed];
  return list.some(p => perms.includes(p));
};

export const permissionsForRoles = (roles: Role[], keys: RoleKey[]): string[] => {
  const s = new Set<string>();
  roles.filter(r => keys.includes(r.key)).forEach(r => r.permissions.forEach(p => s.add(p)));
  return [...s];
};