-- Migration: Expand emergency_relationship CHECK constraint to include grandparent/grandchild relationships

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_emergency_relationship_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_emergency_relationship_check CHECK (
    emergency_relationship IS NULL OR emergency_relationship = ANY (ARRAY[
      'Spouse',
      'Mother',
      'Father',
      'Brother',
      'Sister',
      'Son',
      'Daughter',
      'Sibling',
      'Uncle',
      'Aunt',
      'Nephew',
      'Niece',
      'Cousin',
      'Friend',
      'Parent',
      'Child',
      'Partner',
      'Grandmother',
      'Grandfather',
      'Grandson',
      'Granddaughter'
    ])
  );
