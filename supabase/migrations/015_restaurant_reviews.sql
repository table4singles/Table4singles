-- Restaurant-level reviews: users review the restaurant as a venue
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.restaurant_reviews (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating        smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, restaurant_id)
);

ALTER TABLE public.restaurant_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read restaurant reviews"
  ON public.restaurant_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their own review"
  ON public.restaurant_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review"
  ON public.restaurant_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review"
  ON public.restaurant_reviews FOR DELETE
  USING (auth.uid() = user_id);


-- Replies from the restaurant to each review
CREATE TABLE IF NOT EXISTS public.restaurant_review_replies (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id     uuid NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply         text NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (review_id)
);

ALTER TABLE public.restaurant_review_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read review replies"
  ON public.restaurant_review_replies FOR SELECT USING (true);

CREATE POLICY "Restaurant can insert its own reply"
  ON public.restaurant_review_replies FOR INSERT
  WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Restaurant can update its own reply"
  ON public.restaurant_review_replies FOR UPDATE
  USING (auth.uid() = restaurant_id);

CREATE POLICY "Restaurant can delete its own reply"
  ON public.restaurant_review_replies FOR DELETE
  USING (auth.uid() = restaurant_id);
