export type RoleKey = 'SUPERADMIN'|'ADMIN'|'ORGANIZER'|'HOST'|'TEAM_CAPTAIN'|'PLAYER'|(string & {});

export interface Role { id:string; key:RoleKey; name:string; description:string; permissions:string[]; system:boolean; createdAt:string; }

export interface User {
  id:string; fullName:string; username:string; email:string; phone?:string;
  passwordHash:string; avatar?:string; country?:string; city?:string;
  pubgNickname?:string; pubgId?:string;
  socials:Partial<Record<'telegram'|'instagram'|'youtube'|'tiktok'|'discord'|'website',string>>;
  roles:RoleKey[]; status:'ACTIVE'|'BANNED'|'PENDING'; createdAt:string;
}
export type PublicUser = Omit<User,'passwordHash'>;

export type TeamMemberRole = 'CAPTAIN'|'PLAYER'|'SUBSTITUTE';
export type MemberStatus = 'APPROVED'|'PENDING'|'REJECTED';

export interface Team {
  id:string; name:string; tag:string; slogan?:string; description?:string;
  logo?:string; banner?:string; country?:string; city?:string;
  captainId:string; inviteCode:string; requiresApproval:boolean;
  socials:Partial<Record<'telegram'|'instagram'|'youtube'|'tiktok'|'discord',string>>;
  createdAt:string;
}
export interface TeamMember { id:string; teamId:string; userId:string; role:TeamMemberRole; status:MemberStatus; joinedAt:string; }

export type ApplicationStatus = 'PENDING'|'APPROVED'|'REJECTED'|'INFO_REQUESTED';
export interface OrganizerApplication {
  id:string; userId:string; fullName:string; organizationName:string;
  description:string; experience:string; previousTournaments?:string;
  phone:string; email:string;
  socials:Partial<Record<'telegram'|'instagram'|'youtube'|'tiktok'|'discord'|'website',string>>;
  status:ApplicationStatus; reviewNote?:string; reviewedBy?:string;
  createdAt:string; reviewedAt?:string;
}

export type TournamentStatus = 'DRAFT'|'REGISTRATION_OPEN'|'REGISTRATION_CLOSED'|'UPCOMING'|'LIVE'|'PAUSED'|'FINISHED'|'CANCELLED';
export type PubgMap = 'ERANGEL'|'MIRAMAR'|'RONDO'|'SANHOK';

export interface Stage {
  id:string; tournamentId:string; name:string; order:number;
  date:string; startTime:string; endTime?:string;
  teamCount:number; matchCount:number; maps:PubgMap[];
  qualificationRules?:string; status:'UPCOMING'|'LIVE'|'FINISHED';
}
export interface PrizeSlot { place:number; amount:number; label?:string }
export interface ScoringRule { id:string; tournamentId:string; name:string; placementPoints:Record<number,number>; killPoints:number; }

export interface Tournament {
  id:string; name:string; shortName:string; slug:string;
  logo?:string; banner?:string; description:string; rules:string;
  organizerId:string; contactInfo?:string;
  maps:PubgMap[]; stages:Stage[]; scoringRuleId:string;
  prizePool:number; prizeDistribution:PrizeSlot[];
  registrationOpen:string; registrationClose:string;
  startDate:string; endDate:string;
  status:TournamentStatus; maxTeams:number; minTeamSize:number;
  timezone:string; hostIds:string[]; createdAt:string;
}
export interface TournamentTeam {
  id:string; tournamentId:string; teamId:string; slot:number;
  registeredAt:string; registeredBy:string; status:'ACTIVE'|'DISQUALIFIED'|'WITHDRAWN';
}
export interface TournamentPlayer { id:string; tournamentId:string; teamId:string; userId:string; role:TeamMemberRole; createdAt:string; }

export type MatchStatus = 'UPCOMING'|'LIVE'|'FINISHED';
export interface Match {
  id:string; tournamentId:string; stageId:string; matchNumber:number;
  map:PubgMap; startTime:string; lobbyId?:string; lobbyPassword?:string;
  hostId?:string; status:MatchStatus;
  resultsStatus:'DRAFT'|'SUBMITTED'|'APPROVED'|'PUBLISHED';
}
export interface MatchTeamResult {
  id:string; matchId:string; tournamentId:string; teamId:string;
  placement:number; kills:number; bonus:number; penalty:number;
  enteredBy:string; enteredAt:string;
  status:'DRAFT'|'SUBMITTED'|'APPROVED'|'PUBLISHED';
}
export interface LeaderboardRow {
  rank:number; teamId:string; teamName:string; teamTag:string; teamLogo?:string;
  cd:number; pp:number; kp:number; tp:number;
}
export interface Stream { id:string; tournamentId:string; label:string; youtubeUrl:string; isPrimary:boolean; }
export type NotificationType = 'INFO'|'SUCCESS'|'WARNING'|'ERROR';
export interface Notification { id:string; userId:string; type:NotificationType; title:string; body?:string; href?:string; read:boolean; createdAt:string; }
export interface AuditLog { id:string; actorId:string; actorName:string; action:string; entity:string; entityId:string; meta?:Record<string,unknown>; createdAt:string; }
export interface Session { userId:string; issuedAt:string; }
export interface SearchResults { users:PublicUser[]; teams:Team[]; tournaments:Tournament[]; }