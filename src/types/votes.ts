
export interface VoteCount {
  song_id: string;
  total_votes: number;
  last_vote_at: string | null;
  setlist_id: string;
}

export interface UserVote {
  id: string;
  user_id: string;
  song_id: string;
  created_at: string;
}

export interface AnonymousVote {
  id: string;
  song_id: string;
  ip_address: string;
  created_at: string;
}
