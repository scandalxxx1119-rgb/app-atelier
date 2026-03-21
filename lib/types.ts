export type App = {
  id: string;
  name: string;
  tagline: string;
  url: string | null;
  icon_url: string | null;
  tags: string[] | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  status: string | null;
  tester_slots: number;
  aa_profiles: { username: string; badge: string | null } | null;
  isBoosted?: boolean;
};

export const PLATINUM_LIMIT = 150;
