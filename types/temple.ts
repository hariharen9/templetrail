export interface Temple {
  id: string;
  name: string;
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  history?: string;
  description?: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
  }>;
  price_level?: number;
  types?: string[];
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
}

export interface ItineraryDay {
  day: number;
  temples: Temple[];
  routes: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  startTime: string;
  endTime: string;
}

export interface RouteSegment {
  from: Temple;
  to: Temple;
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  polyline?: string;
  steps?: any[];
}

export interface ItineraryPlan {
  city: string;
  totalDays: number;
  days: ItineraryDay[];
  totalTemples: number;
  totalDistance: number;
  totalDuration: number;
  createdAt: Date;
}
