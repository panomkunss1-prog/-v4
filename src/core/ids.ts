/**
 * Branded identifier aliases. Kept as plain strings so the whole core layer
 * stays portable to C# (where these become readonly struct wrappers).
 */
export type ClubId = string;
export type PlayerId = string;
export type ManagerId = string;
export type CompetitionId = string;
export type SeasonId = string;
export type MatchId = string;
export type DecisionId = string;

export type Tier = 1 | 2 | 3;
