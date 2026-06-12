/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Person, ArchiveRecord, SharedMemory, RecordType } from "./types";

export const INITIAL_PEOPLE: Person[] = [
  {
    id: "john-harrison",
    firstName: "John",
    lastName: "Harrison",
    birthYear: "1892",
    deathYear: "1965",
    birthPlace: "Manchester, United Kingdom",
    deathPlace: "Chicago, USA",
    isAlive: false,
    isPatriarch: true,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200", // Will replace or support visual portrait
    gender: "male",
    bio: "John Harrison was the beloved patriarch of the Harrison line. Born in the industrial heartland of Manchester, UK, he trained as an apprentice surveyor before serving in the Merchant Navy. He later emigrated to the United States, raising his family in Chicago and instilling an unwavering commitment to craft and heritage in his children.",
    quote: `"Keep the foundations strong, and the branches will reach the sun."`,
    spouseId: "eleanor-vance" // Connected relative
  },
  {
    id: "alice-harrison",
    firstName: "Alice",
    lastName: "Harrison",
    birthYear: "1921",
    deathYear: "1998",
    birthPlace: "Lancashire, United Kingdom",
    deathPlace: "Boston, USA",
    isAlive: false,
    avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
    gender: "female",
    fatherId: "john-harrison",
    bio: "Alice Harrison excelled as a community educator and preservationist. She dedicated decades to mapping community oral histories in Massachusetts and ensured letters, photo albums, and property deeds stayed within the family care.",
    quote: `"Our history is not written in textbooks, but in the recipes and letters of our grandparents."`
  },
  {
    id: "robert-harrison",
    firstName: "Robert",
    lastName: "Harrison",
    birthYear: "1924",
    deathYear: "2005",
    birthPlace: "Manchester, United Kingdom",
    deathPlace: "Chicago, USA",
    isAlive: false,
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    gender: "male",
    fatherId: "john-harrison",
    spouseId: "sarah-harrison",
    bio: "Robert was a decorated veteran of WWII and a master landscape architect. He helped design Chicago regional gardens and championed family heritage archives. His gentle demeanor and deep wisdom made him an anchor for the Harrison household.",
    quote: `"In gardens and in families, a deep root system is everything."`
  },
  {
    id: "sarah-harrison",
    firstName: "Sarah",
    lastName: "Harrison",
    maidenName: "O'Connor",
    birthYear: "1952",
    deathYear: undefined,
    birthPlace: "Dublin, Ireland",
    isAlive: true,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    gender: "female",
    spouseId: "robert-harrison",
    bio: "Sarah is a retired music cataloguer and enthusiastic genealogist. She spends her summers compiling old tape records and coordinating with Archives to scan high-resolution maps. She believes family storytelling coordinates a shared moral anchor.",
    quote: `"The past is our collective lullaby, hummed gently from one generation to the next."`
  },
  {
    id: "james-harrison",
    firstName: "James",
    lastName: "Harrison",
    birthYear: "1955",
    deathYear: undefined,
    birthPlace: "Chicago, USA",
    isAlive: true,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    gender: "male",
    fatherId: "robert-harrison",
    bio: "James is a dynamic mechanical restorer and local archivist in Chicago. He maintains chronological catalogs of vintage family artifacts, mechanical clocks, and old diaries, keeping historical preservation moving forward.",
    quote: `"Time is a cycle of gears, and we are the watchmakers keeping family memories perfectly synchronized."`
  },

  // Eleanor Vance family shown in detail screen
  {
    id: "eleanor-vance",
    firstName: "Eleanor",
    lastName: "Vance",
    maidenName: "Thorne",
    birthYear: "1892",
    deathYear: "1974",
    birthPlace: "Lincolnshire, UK",
    deathPlace: "Skegness, UK",
    isAlive: false,
    avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=300", // Classic photo representation
    gender: "female",
    spouseId: "arthur-vance",
    bio: "Eleanor was born in the small village of Market Rasen, the eldest of five children. Growing up in a household steeped in agrarian tradition, she developed a lifelong passion for horticulture and local folklore.\n\nDuring the Great War, she volunteered with the Women's Land Army, where she met Arthur Vance. Their letters, preserved in our template archive, tell a story of resilience and unwavering affection. After the war, they settled in the coastal town of Skegness, where Eleanor became a pillar of the local community and a renowned amateur historian.",
    quote: `"The past is not a foreign country; it is the soil from which our tomorrow grows."`,
    timeline: [
      {
        id: "ev-t1",
        year: "1892",
        monthAndYear: "JULY 1892",
        title: "Birth",
        description: "Market Rasen, Lincolnshire",
        type: "birth"
      },
      {
        id: "ev-t2",
        year: "1912",
        monthAndYear: "JUNE 1912",
        title: "Marriage",
        description: "St. Mary's Church to Arthur Vance",
        type: "marriage"
      },
      {
        id: "ev-t3",
        year: "1922",
        monthAndYear: "FEB 1922",
        title: "First Child",
        description: "Birth of daughter, Margaret Vance",
        type: "child"
      },
      {
        id: "ev-t4",
        year: "1974",
        monthAndYear: "NOV 1974",
        title: "Passing",
        description: "Skegness, UK. Aged 82.",
        type: "death"
      }
    ],
    recordsFound: ["rec-vance-reunion", "rec-marriage-nuptials", "rec-french-letter"]
  },
  {
    id: "arthur-vance",
    firstName: "Arthur",
    lastName: "Vance",
    birthYear: "1890",
    deathYear: "1968",
    birthPlace: "Lincolnshire, UK",
    deathPlace: "Skegness, UK",
    isAlive: false,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    gender: "male",
    spouseId: "eleanor-vance",
    bio: "Arthur Vance was a quiet, meticulous surveyor who served as a lieutenant during the First World War. His letters from France capture the harsh conditions but also his steady warmth and longing for the Lincolnshire meadows. He operated the local land registry in Skegness until retirement.",
    quote: `"Measurements keep us aligned to earth, but family anchors our spirits."`
  },
  {
    id: "margaret-vance",
    firstName: "Margaret",
    lastName: "Trask",
    maidenName: "Vance",
    birthYear: "1922",
    deathYear: "2005",
    birthPlace: "Lincolnshire, UK",
    isAlive: false,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    gender: "female",
    fatherId: "arthur-vance",
    motherId: "eleanor-vance",
    bio: "Margaret Vance excelled in agricultural botany and helped classify regional English orchards. She organized garden forums and compiled her mother's memoirs in thick leather binders.",
    quote: `"Preserve your stories as you would a rare rose, with care and daily reflection."`
  },
  {
    id: "edward-vance",
    firstName: "Edward",
    lastName: "Vance",
    birthYear: "1925",
    deathYear: "1999",
    birthPlace: "Lincolnshire, UK",
    isAlive: false,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    gender: "male",
    fatherId: "arthur-vance",
    motherId: "eleanor-vance",
    bio: "Edward worked in local county administration. He was an avid sketch artist, leaving behind several black and white drawings of the old family estate and coastal piers.",
    quote: `"A pen stroke captures what a lifetime experiences."`
  }
];

export const INITIAL_RECORDS: ArchiveRecord[] = [
  {
    id: "rec-vance-reunion",
    title: "Vance Family Reunion, 1924",
    type: RecordType.PHOTOGRAPH,
    description: "The original gathering at the Sterling estate in Maine. Over thirty cousins gathered for the Golden Jubilee anniversary, marking a decade since the relocation from regional Lincolnshire.",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600",
    dateStr: "Aug 12, 1924",
    year: 1924,
    location: "Sterling Estate, Maine",
    tags: ["Reunion", "Outdoor", "Vance", "Maine"],
    isRestricted: false,
    relatedPersonIds: ["eleanor-vance", "arthur-vance"]
  },
  {
    id: "rec-marriage-nuptials",
    title: "Sterling-Vance Nuptials",
    type: RecordType.VITAL_RECORD,
    description: "Certified copy of the marriage license issued in Cook County following the parish celebration of parish lineage. Witnessed by cousin Sterling and Robert Jenkins.",
    imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600", // Vintage wedding or parchment vibe
    dateStr: "June 04, 1912",
    year: 1912,
    location: "Chicago, Cook County",
    tags: ["Marriage Certificate", "Vance", "Chicago"],
    isRestricted: false,
    relatedPersonIds: ["eleanor-vance", "arthur-vance"],
    transcription: "OFFICIAL CHURCH RECORD\n----------------\nArthur Vance of Lincolnshire and Eleanor Thorne of Lincolnshire were combined in Holy Matrimony on the fourth day of June, 1912 by Reverend William Jenkins. Attested by Robert Davenport and Sarah Thorne."
  },
  {
    id: "rec-french-letter",
    title: "Correspondence from France",
    type: RecordType.LETTER,
    description: "A handwritten letter from Arthur to Mary/Eleanor during his deployment in WWII, capturing quiet moments behind the frontlines and details about rural French architecture.",
    imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600", // Handwriting paper
    dateStr: "Oct 19, 1944",
    year: 1944,
    location: "Lorraine, France",
    tags: ["War Letters", "WWII", "Arthur", "France"],
    isRestricted: true,
    relatedPersonIds: ["arthur-vance"]
  },
  {
    id: "rec-honorable-discharge",
    title: "Honorable Discharge: Sterling, A.",
    type: RecordType.MILITARY,
    description: "Archival record of Arthur Sterling's service in WWII with the 101st Airborne Division, noted for exemplary service and conduct during the European campaign.",
    imageUrl: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?auto=format&fit=crop&q=80&w=600", // Military medal / certificate
    dateStr: "Nov 12, 1945",
    year: 1945,
    location: "Fort Meade, Maryland",
    tags: ["Military Record", "Discharge", "101st Airborne", "Arthur"],
    isRestricted: false,
    relatedPersonIds: ["arthur-vance"]
  },
  {
    id: "rec-homestead-plot",
    title: "Vance Homestead Plot",
    type: RecordType.PROPERTY_MAP,
    description: "Hand-drawn property map showing the original 40-acre land allocation with detailed local brooks, barn footprints, and timber logs annotations.",
    imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600", // Map
    dateStr: "Circa 1888",
    year: 1888,
    location: "Maine, US",
    tags: ["Property Map", "Maine", "Homestead"],
    isRestricted: false,
    relatedPersonIds: ["eleanor-vance"]
  },
  {
    id: "rec-grandma-locket",
    title: "Grandmother's Locket",
    type: RecordType.ARTIFACT,
    description: "Photo inventory of the silver locket passed down to Mary Eleanor, containing a dry rose petal and dual portrait paintings.",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600", // Vintage red box / item
    dateStr: "Dec 24, 1935",
    year: 1935,
    location: "Skegness, UK",
    tags: ["Artifact", "Locket", "Family Heirloom"],
    isRestricted: false,
    relatedPersonIds: ["eleanor-vance"]
  }
];

export const INITIAL_MEMORIES: SharedMemory[] = [
  {
    id: "mem-1",
    personId: "eleanor-vance",
    authorName: "James Davenport",
    authorInitials: "JD",
    text: "I remember Great Grandma Eleanor showing me how to press flowers in her massive leather-bound books. She always had a vibrant story for every single daisy and pressed leaf.",
    dateStr: "Oct 12, 2023"
  },
  {
    id: "mem-2",
    personId: "john-harrison",
    authorName: "Sarah Harrison",
    authorInitials: "SH",
    text: "Robert used to recount how Grandfather John would take walks down the Chicago docks in the evenings, staring out at the water, and whispering sea shanties from his navy days.",
    dateStr: "Nov 21, 2024"
  }
];
