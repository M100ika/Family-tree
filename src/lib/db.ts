import { supabase } from './supabase'
import type { Person, ArchiveRecord, SharedMemory, TimelineEvent } from '../types'

// ================================================================
// PEOPLE
// ================================================================

export async function fetchPeople(userId: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*, timeline_events(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data.length) return []

  const personIds = data.map((p: any) => p.id)
  const { data: links } = await supabase
    .from('record_person_links')
    .select('person_id, record_id')
    .in('person_id', personIds)

  const recordsByPerson = new Map<string, string[]>()
  links?.forEach((l: any) => {
    recordsByPerson.set(l.person_id, [...(recordsByPerson.get(l.person_id) || []), l.record_id])
  })

  return data.map((row: any) => rowToPerson(row, recordsByPerson.get(row.id)))
}

export async function insertPerson(person: Person & { userId: string }): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .insert(personToRow(person))
    .select('*, timeline_events(*)')
    .single()

  if (error) throw error
  return rowToPerson(data)
}

export async function updatePerson(id: string, updates: Partial<Person>): Promise<void> {
  const { error } = await supabase
    .from('people')
    .update(personToRow(updates as Person))
    .eq('id', id)

  if (error) throw error
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from('people').delete().eq('id', id)
  if (error) throw error
}

// ================================================================
// ARCHIVE RECORDS
// ================================================================

export async function fetchRecords(userId: string): Promise<ArchiveRecord[]> {
  const { data, error } = await supabase
    .from('archive_records')
    .select('*, record_person_links(person_id)')
    .eq('user_id', userId)
    .order('year', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToRecord)
}

export async function insertRecord(record: ArchiveRecord, userId: string): Promise<ArchiveRecord> {
  const { relatedPersonIds, ...rest } = record

  const { data, error } = await supabase
    .from('archive_records')
    .insert({
      user_id:      userId,
      title:        rest.title,
      type:         rest.type,
      description:  rest.description,
      image_url:    rest.imageUrl,
      date_str:     rest.dateStr,
      year:         rest.year,
      location:     rest.location,
      tags:         rest.tags,
      transcription: rest.transcription,
      is_restricted: rest.isRestricted ?? false,
    })
    .select()
    .single()

  if (error) throw error

  if (relatedPersonIds?.length) {
    await supabase.from('record_person_links').insert(
      relatedPersonIds.map(pid => ({ record_id: data.id, person_id: pid }))
    )
  }

  return rowToRecord({ ...data, record_person_links: (relatedPersonIds || []).map(pid => ({ person_id: pid })) })
}

// ================================================================
// SHARED MEMORIES
// ================================================================

export async function fetchAllMemories(userId: string): Promise<SharedMemory[]> {
  const { data: people } = await supabase
    .from('people')
    .select('id')
    .eq('user_id', userId)

  if (!people?.length) return []

  const personIds = people.map((p: any) => p.id)
  const { data, error } = await supabase
    .from('shared_memories')
    .select('*')
    .in('person_id', personIds)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToMemory)
}

export async function insertMemory(memory: SharedMemory, userId: string): Promise<SharedMemory> {
  const { data, error } = await supabase
    .from('shared_memories')
    .insert({
      person_id:       memory.personId,
      author_user_id:  userId,
      author_name:     memory.authorName,
      author_initials: memory.authorInitials,
      text:            memory.text,
    })
    .select()
    .single()

  if (error) throw error
  return rowToMemory(data)
}

// ================================================================
// TIMELINE EVENTS
// ================================================================

export async function insertTimelineEvent(personId: string, event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> {
  const { data, error } = await supabase
    .from('timeline_events')
    .insert({
      person_id:       personId,
      year:            event.year,
      month_and_year:  event.monthAndYear,
      title:           event.title,
      description:     event.description,
      type:            event.type,
    })
    .select()
    .single()

  if (error) throw error
  return rowToTimeline(data)
}

// ================================================================
// BIO UPDATE
// ================================================================

export async function updatePersonBio(personId: string, bio: string, quote: string): Promise<void> {
  const { error } = await supabase
    .from('people')
    .update({ biography: bio, quote })
    .eq('id', personId)

  if (error) throw error
}

// ================================================================
// ROW MAPPERS
// ================================================================

function rowToPerson(row: any, recordIds?: string[]): Person {
  return {
    id:          row.id,
    userId:      row.user_id,
    firstName:   row.first_name,
    lastName:    row.last_name ?? '',
    maidenName:  row.maiden_name,
    birthYear:   row.birth_year ?? '',
    deathYear:   row.death_year,
    birthPlace:  row.birth_place,
    deathPlace:  row.death_place,
    isAlive:     row.is_alive ?? true,
    isPatriarch: row.is_patriarch ?? false,
    avatarUrl:   row.avatar_url ?? '',
    bio:         row.biography,
    quote:       row.quote,
    fatherId:    row.father_id,
    motherId:    row.mother_id,
    spouseId:    row.spouse_id,
    gender:      row.gender ?? 'other',
    timeline:    (row.timeline_events || []).map(rowToTimeline),
    recordsFound: recordIds || [],
  }
}

function personToRow(p: Partial<Person> & { userId?: string }) {
  const row: Record<string, any> = {}
  if (p.userId      !== undefined) row.user_id      = p.userId
  if (p.firstName   !== undefined) row.first_name   = p.firstName
  if (p.lastName    !== undefined) row.last_name    = p.lastName
  if (p.maidenName  !== undefined) row.maiden_name  = p.maidenName
  if (p.birthYear   !== undefined) row.birth_year   = p.birthYear
  if (p.deathYear   !== undefined) row.death_year   = p.deathYear
  if (p.birthPlace  !== undefined) row.birth_place  = p.birthPlace
  if (p.deathPlace  !== undefined) row.death_place  = p.deathPlace
  if (p.isAlive     !== undefined) row.is_alive     = p.isAlive
  if (p.isPatriarch !== undefined) row.is_patriarch = p.isPatriarch
  if (p.avatarUrl   !== undefined) row.avatar_url   = p.avatarUrl
  if (p.bio         !== undefined) row.biography    = p.bio
  if (p.quote       !== undefined) row.quote        = p.quote
  if (p.fatherId    !== undefined) row.father_id    = p.fatherId
  if (p.motherId    !== undefined) row.mother_id    = p.motherId
  if (p.spouseId    !== undefined) row.spouse_id    = p.spouseId
  if (p.gender      !== undefined) row.gender       = p.gender
  return row
}

function rowToRecord(row: any): ArchiveRecord {
  return {
    id:              row.id,
    title:           row.title,
    type:            row.type,
    description:     row.description ?? '',
    imageUrl:        row.image_url ?? '',
    dateStr:         row.date_str ?? '',
    year:            row.year ?? 0,
    location:        row.location,
    tags:            row.tags ?? [],
    transcription:   row.transcription,
    isRestricted:    row.is_restricted ?? false,
    relatedPersonIds: (row.record_person_links || []).map((l: any) => l.person_id),
  }
}

function rowToMemory(row: any): SharedMemory {
  return {
    id:              row.id,
    personId:        row.person_id,
    authorName:      row.author_name,
    authorInitials:  row.author_initials ?? '',
    text:            row.text,
    dateStr:         new Date(row.created_at).toLocaleDateString('en-US', {
                       month: 'short', day: 'numeric', year: 'numeric'
                     }),
  }
}

function rowToTimeline(row: any): TimelineEvent {
  return {
    id:           row.id,
    year:         row.year,
    monthAndYear: row.month_and_year,
    title:        row.title,
    description:  row.description ?? '',
    type:         row.type ?? 'other',
  }
}
