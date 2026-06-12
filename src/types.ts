/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RecordType {
  PHOTOGRAPH = "Photograph",
  VITAL_RECORD = "Vital Record",
  LETTER = "Letter",
  MILITARY = "Military",
  PROPERTY_MAP = "Property Map",
  ARTIFACT = "Artifact"
}

export interface TimelineEvent {
  id: string;
  year: string;
  monthAndYear?: string;
  title: string;
  description: string;
  type: "birth" | "marriage" | "child" | "death" | "other";
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  birthYear: string;
  deathYear?: string; // empty if alive
  birthPlace?: string;
  deathPlace?: string;
  isAlive: boolean;
  isPatriarch?: boolean;
  avatarUrl: string;
  bio?: string;
  quote?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  gender: "male" | "female" | "other";
  timeline?: TimelineEvent[];
  recordsFound?: string[]; // list of Record IDs associated
}

export interface ArchiveRecord {
  id: string;
  title: string;
  type: RecordType;
  description: string;
  imageUrl: string;
  dateStr: string;
  year: number;
  location?: string;
  tags: string[];
  transcription?: string; // text from OCR analyzer
  isRestricted?: boolean;
  relatedPersonIds?: string[];
}

export interface SharedMemory {
  id: string;
  personId: string;
  authorName: string;
  authorInitials: string;
  text: string;
  dateStr: string;
}

export interface ActiveSession {
  userEmail: string;
  isLoggedIn: boolean;
}
