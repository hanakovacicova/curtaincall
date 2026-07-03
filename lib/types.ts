export type Profile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export type Play = {
  id: string
  title: string
  playwright: string | null
  genre: string | null
  description: string | null
  created_by: string | null
  created_at: string
}

export type Production = {
  id: string
  play_id: string
  venue: string | null
  director: string | null
  year: number | null
  city: string | null
  country: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  play?: Play
}

export type Log = {
  id: string
  user_id: string
  production_id: string
  watched_at: string
  rating: number | null
  review: string | null
  created_at: string
  production?: Production & { play: Play }
  profile?: Profile
}

export type WatchlistItem = {
  id: string
  user_id: string
  play_id: string
  created_at: string
  play?: Play
}

export type Theatre = {
  id: string
  name: string
  slug: string
  city: string
  website: string | null
}

export type UpcomingShow = {
  id: string
  theatre_id: string
  title: string
  slug: string | null
  description: string | null
  venue: string | null
  starts_at: string
  ticket_url: string | null
  external_id: string
  theatre?: Theatre
}
