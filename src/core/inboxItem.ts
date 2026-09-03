import type { GameDate } from './gameDate';

/**
 * Every InboxItem is ORGANISATIONAL information for the chairman — a result,
 * a board note, a finance/sponsor reminder, a season milestone. None of it is
 * a tactical decision or a match-control surface (brief PLAYER ROLE).
 */
export type InboxCategory = 'season' | 'board' | 'finance' | 'sponsor' | 'match' | 'squad';

export interface InboxItem {
  id: string;
  date: GameDate;
  category: InboxCategory;
  title: string;
  body: string;
  read: boolean;
}
