export type RoleKey = 'SUPERADMIN'|'ADMIN'|'ORGANIZER'|'HOST'|'TEAM_CAPTAIN'|'PLAYER'|(string & {});
export interface Role { id:string; key:RoleKey; name:string; description:string; permissions:string[]; system:boolean; createdAt:string; }

export interface User {
  id:string; fullName:string; username:string; email:string; phone?:string;
  passwordHash:string; avatar?:string; country?:string; city?:string;
  pubgNickname?:string; pubgId?:string;
  bio?:string;
  experienceYears?:number;
  favoriteMap?:string;
  achievements?:string[];
  socials:Partial<Record<'telegram'|'instagram'|'youtube'|'tiktok'|'discord'|'website',string>>;
  roles:RoleKey[]; status:'ACTIVE'|'BANNED'|'PENDING'; createdAt:string;
}
export type PublicUser = Omit<User,'passwordHash'>;

export type TeamMemberRole = 'CAPTAIN'|'PLAYER'|'SUBSTITUTE'|'MANAGER';
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
  qualificationRules?:string; qualificationCount?:number;
  status:'UPCOMING'|'LIVE'|'FINISHED';
  carryPoints:boolean;
}

export interface PrizeSlot { place:number; amount:number; label?:string }
export interface ScoringRule { id:string; tournamentId:string; name:string; placementPoints:Record<number,number>; killPoints:number; }
export type TieBreakType = 'WINS'|'TOTAL_KILLS'|'BEST_PLACEMENT'|'LAST_MATCH_PLACEMENT'|'TOTAL_PLACEMENT_POINTS';
export interface TieBreakRule { type:TieBreakType; order:number; }
export interface RosterRules { minPlayers:number; maxPlayers:number; minClanTags:number; minAccountLevel:number; }
export interface StreamEntry { url:string; updatedBy:string; updatedAt:string; }

export interface Tournament {
  id:string; name:string; shortName:string; slug:string;
  logo?:string; banner?:string; description:string; rules:string;
  organizerId:string; adminLink?:string;
  maps:PubgMap[]; stages:Stage[]; scoringRuleId:string;
  tieBreakers:TieBreakRule[]; rosterRules:RosterRules;
  prizePool:number; prizeDistribution:PrizeSlot[];
  isPaid:boolean; entryFee:number;
  registrationOpen:string; registrationClose:string;
  startDate:string; endDate:string;
  status:TournamentStatus; maxTeams:number; timezone:string; hostIds:string[];
  currentStreamUrl?:string; streamHistory:StreamEntry[];
  stageCarryMode:'RESET_POINTS_FOR_NEXT_STAGE'|'CARRY_POINTS_TO_NEXT_STAGE';
  createdAt:string;
}

export interface TournamentTeam {
  id:string; tournamentId:string; teamId:string; slot:number;
  registeredAt:string; registeredBy:string;
  status:'ACTIVE'|'DISQUALIFIED'|'WITHDRAWN'; dqReason?:string;
}
export interface TournamentPlayer { id:string; tournamentId:string; teamId:string; userId:string; role:TeamMemberRole; createdAt:string; }

export type MatchStatus = 'UPCOMING'|'LIVE'|'FINISHED'|'CANCELLED'|'REMATCH_REQUESTED'|'REMATCH_APPROVED';
export interface Match {
  id:string; tournamentId:string; stageId:string; matchNumber:number;
  map:PubgMap; startTime:string; lobbyId?:string; lobbyPassword?:string;
  hostId?:string; status:MatchStatus;
  resultsStatus:'DRAFT'|'SUBMITTED'|'APPROVED'|'PUBLISHED';
  streamUrl?:string; rematchOf?:string; rematchReason?:string;
}
export interface MatchTeamResult {
  id:string; matchId:string; tournamentId:string; stageId:string; teamId:string;
  placement:number; kills:number; bonus:number; penalty:number;
  placementPoints:number; killPoints:number; totalPoints:number;
  enteredBy:string; enteredAt:string;
  status:'DRAFT'|'SUBMITTED'|'APPROVED'|'PUBLISHED';
}
export interface ScoreCorrection {
  id:string; resultId:string; tournamentId:string;
  oldValue:Partial<MatchTeamResult>; newValue:Partial<MatchTeamResult>;
  reason:string; changedBy:string; changedAt:string;
}
export interface LeaderboardRow {
  rank:number; teamId:string; teamName:string; teamTag:string; teamLogo?:string;
  cd:number; pp:number; kp:number; tp:number;
  wins:number; bestPlacement:number; totalKills:number;
  status:'ACTIVE'|'DISQUALIFIED';
}
export interface Stream { id:string; tournamentId:string; label:string; youtubeUrl:string; isPrimary:boolean; }
export type NotificationType = 'INFO'|'SUCCESS'|'WARNING'|'ERROR';
export interface Notification { id:string; userId:string; type:NotificationType; title:string; body?:string; href?:string; read:boolean; createdAt:string; }
export interface AuditLog { id:string; actorId:string; actorName:string; action:string; entity:string; entityId:string; oldValue?:unknown; newValue?:unknown; createdAt:string; }
export interface Session { userId:string; issuedAt:string; }
export interface SearchResults { users:PublicUser[]; teams:Team[]; tournaments:Tournament[]; }

/* ---- Wallet ---- */
export interface Wallet {
  userId:string;
  balance:number;
  currency:'UZS';
  updatedAt:string;
}

export type WalletTransactionType = 'TOP_UP'|'TOURNAMENT_ENTRY'|'PRIZE_WIN'|'REFUND'|'ADMIN_ADJUST';

export interface WalletTransaction {
  id:string;
  userId:string;
  type:WalletTransactionType;
  amount:number;
  balanceAfter:number;
  description:string;
  refId?:string;
  createdAt:string;
}

export type TopUpStatus = 'PENDING_PAYMENT'|'AWAITING_CONFIRMATION'|'APPROVED'|'REJECTED'|'EXPIRED'|'CANCELLED';

export interface TopUpRequest {
  id:string;
  userId:string;
  requestedAmount:number;
  uniqueAmount:number;
  status:TopUpStatus;
  cardNumber:string;
  cardHolder:string;
  phoneNumber:string;
  bankName?:string;
  cardId?:string;
  createdAt:string;
  expiresAt:string;
  paidAt?:string;
  confirmedAt?:string;
  confirmedBy?:string;
  rejectedReason?:string;
}

export interface PaymentCard {
  id:string;
  cardNumber:string;
  cardHolder:string;
  phoneNumber:string;
  bankName:string;
  label?:string;
  isActive:boolean;
  createdAt:string;
}

export interface PaymentSettings {
  cards:PaymentCard[];
  minTopUp:number;
  maxTopUp:number;
  updatedAt:string;
  updatedBy:string;
}
