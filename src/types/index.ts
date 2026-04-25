export type Category = 'food' | 'cafe' | 'spot' | 'shopping' | 'activity'
export type City = '서울' | '부산' | '제주' | '강원' | '경상' | '전라' | '충청' | '경기' | '인천'

export interface Place {
  id: string
  name: string
  category: Category
  city: City
  district: string
  address: string
  description?: string
  image_url?: string
  latitude?: number
  longitude?: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  city?: City
  images?: string[]
  created_at: string
  updated_at: string
  post_likes?: [{ count: number }]
  post_comments?: [{ count: number }]
}

export interface Profile {
  id: string
  email: string
  nickname: string
  avatar_url?: string
  created_at: string
}
