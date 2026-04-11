'use client';

import { TravelerProfile, Trip } from './types';

const PROFILES_KEY = 'tripai_profiles';
const TRIPS_KEY = 'tripai_trips';
const SETTINGS_KEY = 'tripai_settings';

export function getProfiles(): TravelerProfile[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PROFILES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getProfile(id: string): TravelerProfile | null {
  const profiles = getProfiles();
  return profiles.find(p => p.id === id) || null;
}

export function saveProfile(profile: TravelerProfile): void {
  const profiles = getProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getTrips(): Trip[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TRIPS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTrip(trip: Trip): void {
  const trips = getTrips();
  const idx = trips.findIndex(t => t.id === trip.id);
  if (idx >= 0) {
    trips[idx] = trip;
  } else {
    trips.push(trip);
  }
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export function getTrip(id: string): Trip | null {
  const trips = getTrips();
  return trips.find(t => t.id === id) || null;
}

export function deleteTrip(id: string): void {
  const trips = getTrips().filter(t => t.id !== id);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export interface AppSettings {
  geminiApiKey: string;
  openaiApiKey: string;
  language: 'he' | 'en';
  aiProvider: 'gemini' | 'openai' | 'demo';
}

export function getSettings(): AppSettings {
  const defaults: AppSettings = { geminiApiKey: '', openaiApiKey: '', language: 'he', aiProvider: 'gemini' };
  if (typeof window === 'undefined') return defaults;
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return defaults;
  try {
    const parsed = JSON.parse(data) as AppSettings;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
