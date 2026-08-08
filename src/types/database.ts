export type UserRole = 'user' | 'restaurant'
export type TableStatus = 'open' | 'full' | 'completed' | 'cancelled'
export type ParticipantStatus = 'pending' | 'approved'
export type JoinType = 'word' | 'deposit'
export type InvitationStatus = 'pending' | 'accepted' | 'declined'

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  street_address: string | null
  city: string | null
  province: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  date_of_birth: string | null
  phone: string | null
  instagram: string | null
  onboarding_completed: boolean
  email_notifications: boolean
  push_notifications: boolean
  theme_preference: 'light' | 'dark'
  languages: string[] | null
  interests: string[] | null
  role: UserRole
  is_admin: boolean
  word_penalised: boolean
  restaurant_name: string | null
  restaurant_cuisine: string | null
  restaurant_description: string | null
  restaurant_website: string | null
  restaurant_phone: string | null
  restaurant_price_range: string | null
  restaurant_photos: string[] | null
  restaurant_hours: string | null
  restaurant_total_tables: number | null
  restaurant_menu_url: string | null
  restaurant_offers: string | null
  restaurant_specialties: string[] | null
  restaurant_address: string | null
  referred_by: string | null
  created_at: string
}

export interface DiningTable {
  id: string
  host_id: string
  restaurant_name: string
  restaurant_address: string | null
  restaurant_city: string
  restaurant_country: string
  restaurant_image_url: string | null
  date: string
  time: string | null
  max_seats: number
  available_seats: number
  status: TableStatus
  description: string | null
  cuisine_type: string | null
  languages: string[] | null
  deposit_amount: number
  host_reminder_sent: boolean
  is_active: boolean
  available_until: string | null
  created_at: string
}

export interface TableParticipant {
  id: string
  table_id: string
  user_id: string
  status: ParticipantStatus
  join_type: JoinType
  deposit_paid: boolean
  reminder_sent: boolean
  created_at: string
  profiles?: Profile
}

export interface Invitation {
  id: string
  table_id: string
  inviter_id: string
  invitee_id: string
  payment_covered: boolean
  status: InvitationStatus
  created_at: string
  updated_at: string | null
}

export interface Review {
  id: string
  table_id: string
  host_id: string
  reviewer_id: string
  rating: number
  comment: string | null
  ambiance_rating: number | null
  food_rating: number | null
  company_rating: number | null
  created_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  table_id: string
  sender_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  metadata: Record<string, unknown> | null
  read: boolean
  created_at: string
}

export interface City {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
  active: boolean
}

export interface RefundClaim {
  id: string
  table_id: string
  user_id: string
  reason: string
  status: string
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  restaurant_id: string
  created_at: string
}

export interface DinerReview {
  id: string
  table_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  created_at: string
}

export interface DinerTrustScore {
  avg_rating: number
  review_count: number
}

export interface RestaurantReview {
  id: string
  user_id: string
  restaurant_id: string
  rating: number
  comment: string | null
  created_at: string
  profiles?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>
  restaurant_review_replies?: RestaurantReviewReply[]
}

export interface RestaurantReviewReply {
  id: string
  review_id: string
  restaurant_id: string
  reply: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> }
      dining_tables: { Row: DiningTable; Insert: Omit<DiningTable, 'id' | 'created_at'>; Update: Partial<DiningTable> }
      table_participants: { Row: TableParticipant; Insert: Omit<TableParticipant, 'id' | 'created_at'>; Update: Partial<TableParticipant> }
      invitations: { Row: Invitation; Insert: Omit<Invitation, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Invitation> }
      reviews: { Row: Review; Insert: Omit<Review, 'id' | 'created_at'>; Update: Partial<Review> }
      messages: { Row: Message; Insert: Omit<Message, 'id' | 'created_at'>; Update: Partial<Message> }
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Notification> }
      cities: { Row: City; Insert: Omit<City, 'id'>; Update: Partial<City> }
      refund_claims: { Row: RefundClaim; Insert: Omit<RefundClaim, 'id' | 'created_at'>; Update: Partial<RefundClaim> }
      favorites: { Row: Favorite; Insert: Omit<Favorite, 'id' | 'created_at'>; Update: Partial<Favorite> }
      diner_reviews: { Row: DinerReview; Insert: Omit<DinerReview, 'id' | 'created_at'>; Update: Partial<DinerReview> }
    }
  }
}
