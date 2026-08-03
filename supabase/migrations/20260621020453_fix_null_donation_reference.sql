-- 1. Backfill existing null references
UPDATE public.donations
SET reference = UPPER(SUBSTRING(id::text, 1, 8))
WHERE reference IS NULL;

-- 2. Create trigger function to auto-populate reference on insert
CREATE OR REPLACE FUNCTION public.populate_donation_reference()
RETURNS trigger AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := UPPER(SUBSTRING(NEW.id::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind trigger BEFORE INSERT
CREATE OR REPLACE TRIGGER trg_populate_donation_reference
  BEFORE INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_donation_reference();
