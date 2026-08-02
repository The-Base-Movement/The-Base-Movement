-- Migration: Reconcile ghana_constituencies with official EC 2024 Polling Station dataset
-- and make the network assignment trigger resilient to punctuation (slashes, hyphens, spaces).

DO $$ BEGIN
  -- 1. Reconcile ghana_constituencies names with EC polling stations dataset
  UPDATE public.ghana_constituencies SET name = 'Adansi Asokwa' WHERE lower(trim(name)) = lower('Adansi-Asokwa');
  UPDATE public.ghana_constituencies SET name = 'Ahafo Ano South-East' WHERE lower(trim(name)) = lower('Ahafo Ano South East');
  UPDATE public.ghana_constituencies SET name = 'Atwima Kwanwoma' WHERE lower(trim(name)) = lower('Atwima-Kwanwoma');
  UPDATE public.ghana_constituencies SET name = 'Atwima Nwabiagya South' WHERE lower(trim(name)) = lower('Atwima-Nwabiagya South');
  UPDATE public.ghana_constituencies SET name = 'Atwima Nwabiagya North' WHERE lower(trim(name)) = lower('Atwima-Nwabiagya North');
  UPDATE public.ghana_constituencies SET name = 'Bosome Freho' WHERE lower(trim(name)) = lower('Bosome-Freho');
  UPDATE public.ghana_constituencies SET name = 'Ejura Sekyedumase' WHERE lower(trim(name)) = lower('Ejura-Sekyedumase');
  UPDATE public.ghana_constituencies SET name = 'Nsuta/Kwamang/Beposo' WHERE lower(trim(name)) = lower('Nsuta-Kwamang-Beposo');
  UPDATE public.ghana_constituencies SET name = 'Effiduase/Asokore' WHERE lower(trim(name)) = lower('Effiduase-Asokore');
  UPDATE public.ghana_constituencies SET name = 'Atebubu/Amantin' WHERE lower(trim(name)) = lower('Atebubu-Amantin');
  UPDATE public.ghana_constituencies SET name = 'Abura Asebu Kwamankese' WHERE lower(trim(name)) = lower('Abura-Asebu-Kwamankese');
  UPDATE public.ghana_constituencies SET name = 'Asikuma/Odoben/Brakwa' WHERE lower(trim(name)) = lower('Asikuma-Odoben-Brakwa');
  UPDATE public.ghana_constituencies SET name = 'Awutu Senya East' WHERE lower(trim(name)) = lower('Awutu-Senya East');
  UPDATE public.ghana_constituencies SET name = 'Awutu Senya West' WHERE lower(trim(name)) = lower('Awutu-Senya West');
  UPDATE public.ghana_constituencies SET name = 'Ofoase/Ayirebi' WHERE lower(trim(name)) = lower('Ofoase-Ayirebi');
  UPDATE public.ghana_constituencies SET name = 'Asene/Akroso/Manso' WHERE lower(trim(name)) = lower('Asene Akroso Manso');
  UPDATE public.ghana_constituencies SET name = 'Nsawam/Adoagyiri' WHERE lower(trim(name)) = lower('Nsawam Adoagyiri');
  UPDATE public.ghana_constituencies SET name = 'Anyaa/Sowutuom' WHERE lower(trim(name)) = lower('Anyaa-Sowutuom');
  UPDATE public.ghana_constituencies SET name = 'Dome/Kwabenya' WHERE lower(trim(name)) = lower('Dome-Kwabenya');
  UPDATE public.ghana_constituencies SET name = 'Dadekotopon' WHERE lower(trim(name)) = lower('Dade Kotopon');
  UPDATE public.ghana_constituencies SET name = 'Ningo Prampram' WHERE lower(trim(name)) = lower('Ningo-Prampram');
  UPDATE public.ghana_constituencies SET name = 'Yagaba/ Kubori' WHERE lower(trim(name)) = lower('Yagaba-Kubori');
  UPDATE public.ghana_constituencies SET name = 'Tatale/Sanguli' WHERE lower(trim(name)) = lower('Tatale-Sanguli');
  UPDATE public.ghana_constituencies SET name = 'Daboya / Mankarigu' WHERE lower(trim(name)) = lower('Daboya-Mankarigu');
  UPDATE public.ghana_constituencies SET name = 'Yapei/Kusawgu' WHERE lower(trim(name)) = lower('Yapei-Kusawgu');
  UPDATE public.ghana_constituencies SET name = 'Nadowli/Kaleo' WHERE lower(trim(name)) = lower('Nadowli-Kaleo');
  UPDATE public.ghana_constituencies SET name = 'Daffiama/Bussie/Issa' WHERE lower(trim(name)) = lower('Daffiama-Bussie-Issa');
  UPDATE public.ghana_constituencies SET name = 'Agotime Ziope' WHERE lower(trim(name)) = lower('Agotime-Ziope');
  UPDATE public.ghana_constituencies SET name = 'Evalue Ajomoro Gwira' WHERE lower(trim(name)) = lower('Evalue-Ajomoro-Gwira');
  UPDATE public.ghana_constituencies SET name = 'Tarkwa Nsuaem' WHERE lower(trim(name)) = lower('Tarkwa-Nsuaem');
  UPDATE public.ghana_constituencies SET name = 'Sefwi Wiawso' WHERE lower(trim(name)) = lower('Sefwi-Wiawso');
  UPDATE public.ghana_constituencies SET name = 'New Edubiase' WHERE lower(trim(name)) = lower('New Edubease');
  UPDATE public.ghana_constituencies SET name = 'Manso Adubia' WHERE lower(trim(name)) = lower('Manso Edubia');
  UPDATE public.ghana_constituencies SET name = 'Afigya Seyere East' WHERE lower(trim(name)) = lower('Afigya Sekyere East');
  UPDATE public.ghana_constituencies SET name = 'Banda' WHERE lower(trim(name)) = lower('Banda Ahenkro');
  UPDATE public.ghana_constituencies SET name = 'Ajumako Enyan Esiam' WHERE lower(trim(name)) = lower('Ajumako-Enyan-Essiam');
  UPDATE public.ghana_constituencies SET name = 'Komenda Edina Eguafo Abrem' WHERE lower(trim(name)) = lower('Komenda-Edina-Eguafo-Abirem');
  UPDATE public.ghana_constituencies SET name = 'Twifo Atti Morkwa' WHERE lower(trim(name)) = lower('Twifo-Atii Morkwaa');
  UPDATE public.ghana_constituencies SET name = 'Akuapem South' WHERE lower(trim(name)) = lower('Akwapim South');
  UPDATE public.ghana_constituencies SET name = 'Kwahu Afram Plains North' WHERE lower(trim(name)) = lower('Afram Plains North');
  UPDATE public.ghana_constituencies SET name = 'Lower Manya Krobo' WHERE lower(trim(name)) = lower('Lower Manya');
  UPDATE public.ghana_constituencies SET name = 'Upper Manya Krobo' WHERE lower(trim(name)) = lower('Upper Manya');
  UPDATE public.ghana_constituencies SET name = 'Ayawaso West Wuogon' WHERE lower(trim(name)) = lower('Ayawaso West');
  UPDATE public.ghana_constituencies SET name = 'Bortianor-Ngleshie Amanfro' WHERE lower(trim(name)) = lower('Bortianor-Ngleshie-Amanfrom');
  UPDATE public.ghana_constituencies SET name = 'Madina' WHERE lower(trim(name)) = lower('Abokobi-Madina');
  UPDATE public.ghana_constituencies SET name = 'Weija-Gbawe' WHERE lower(trim(name)) = lower('Weija');
  UPDATE public.ghana_constituencies SET name = 'Nalerigu / Gambaga' WHERE lower(trim(name)) = lower('Nalerigu');
  UPDATE public.ghana_constituencies SET name = 'Bole-Bamboi' WHERE lower(trim(name)) = lower('Bole');
  UPDATE public.ghana_constituencies SET name = 'Bolga East' WHERE lower(trim(name)) = lower('Bolgatanga East');
  UPDATE public.ghana_constituencies SET name = 'Essikadu-Ketan' WHERE lower(trim(name)) = lower('Essikado-Ketan');

  -- 2. Update member records in public.users to match EC canonical names
  UPDATE public.users SET constituency = 'Adansi Asokwa' WHERE lower(trim(constituency)) = lower('Adansi-Asokwa');
  UPDATE public.users SET constituency = 'Ahafo Ano South-East' WHERE lower(trim(constituency)) = lower('Ahafo Ano South East');
  UPDATE public.users SET constituency = 'Atwima Kwanwoma' WHERE lower(trim(constituency)) = lower('Atwima-Kwanwoma');
  UPDATE public.users SET constituency = 'Atwima Nwabiagya South' WHERE lower(trim(constituency)) = lower('Atwima-Nwabiagya South');
  UPDATE public.users SET constituency = 'Atwima Nwabiagya North' WHERE lower(trim(constituency)) = lower('Atwima-Nwabiagya North');
  UPDATE public.users SET constituency = 'Bosome Freho' WHERE lower(trim(constituency)) = lower('Bosome-Freho');
  UPDATE public.users SET constituency = 'Ejura Sekyedumase' WHERE lower(trim(constituency)) = lower('Ejura-Sekyedumase');
  UPDATE public.users SET constituency = 'Nsuta/Kwamang/Beposo' WHERE lower(trim(constituency)) = lower('Nsuta-Kwamang-Beposo');
  UPDATE public.users SET constituency = 'Effiduase/Asokore' WHERE lower(trim(constituency)) = lower('Effiduase-Asokore');
  UPDATE public.users SET constituency = 'Atebubu/Amantin' WHERE lower(trim(constituency)) = lower('Atebubu-Amantin');
  UPDATE public.users SET constituency = 'Abura Asebu Kwamankese' WHERE lower(trim(constituency)) = lower('Abura-Asebu-Kwamankese');
  UPDATE public.users SET constituency = 'Asikuma/Odoben/Brakwa' WHERE lower(trim(constituency)) = lower('Asikuma-Odoben-Brakwa');
  UPDATE public.users SET constituency = 'Awutu Senya East' WHERE lower(trim(constituency)) = lower('Awutu-Senya East');
  UPDATE public.users SET constituency = 'Awutu Senya West' WHERE lower(trim(constituency)) = lower('Awutu-Senya West');
  UPDATE public.users SET constituency = 'Ofoase/Ayirebi' WHERE lower(trim(constituency)) = lower('Ofoase-Ayirebi');
  UPDATE public.users SET constituency = 'Asene/Akroso/Manso' WHERE lower(trim(constituency)) = lower('Asene Akroso Manso');
  UPDATE public.users SET constituency = 'Nsawam/Adoagyiri' WHERE lower(trim(constituency)) = lower('Nsawam Adoagyiri');
  UPDATE public.users SET constituency = 'Anyaa/Sowutuom' WHERE lower(trim(constituency)) = lower('Anyaa-Sowutuom');
  UPDATE public.users SET constituency = 'Dome/Kwabenya' WHERE lower(trim(constituency)) = lower('Dome-Kwabenya');
  UPDATE public.users SET constituency = 'Dadekotopon' WHERE lower(trim(constituency)) = lower('Dade Kotopon');
  UPDATE public.users SET constituency = 'Ningo Prampram' WHERE lower(trim(constituency)) = lower('Ningo-Prampram');
  UPDATE public.users SET constituency = 'Yagaba/ Kubori' WHERE lower(trim(constituency)) = lower('Yagaba-Kubori');
  UPDATE public.users SET constituency = 'Tatale/Sanguli' WHERE lower(trim(constituency)) = lower('Tatale-Sanguli');
  UPDATE public.users SET constituency = 'Daboya / Mankarigu' WHERE lower(trim(constituency)) = lower('Daboya-Mankarigu');
  UPDATE public.users SET constituency = 'Yapei/Kusawgu' WHERE lower(trim(constituency)) = lower('Yapei-Kusawgu');
  UPDATE public.users SET constituency = 'Nadowli/Kaleo' WHERE lower(trim(constituency)) = lower('Nadowli-Kaleo');
  UPDATE public.users SET constituency = 'Daffiama/Bussie/Issa' WHERE lower(trim(constituency)) = lower('Daffiama-Bussie-Issa');
  UPDATE public.users SET constituency = 'Agotime Ziope' WHERE lower(trim(constituency)) = lower('Agotime-Ziope');
  UPDATE public.users SET constituency = 'Evalue Ajomoro Gwira' WHERE lower(trim(constituency)) = lower('Evalue-Ajomoro-Gwira');
  UPDATE public.users SET constituency = 'Tarkwa Nsuaem' WHERE lower(trim(constituency)) = lower('Tarkwa-Nsuaem');
  UPDATE public.users SET constituency = 'Sefwi Wiawso' WHERE lower(trim(constituency)) = lower('Sefwi-Wiawso');
  UPDATE public.users SET constituency = 'New Edubiase' WHERE lower(trim(constituency)) = lower('New Edubease');
  UPDATE public.users SET constituency = 'Manso Adubia' WHERE lower(trim(constituency)) = lower('Manso Edubia');
  UPDATE public.users SET constituency = 'Afigya Seyere East' WHERE lower(trim(constituency)) = lower('Afigya Sekyere East');
  UPDATE public.users SET constituency = 'Banda' WHERE lower(trim(constituency)) = lower('Banda Ahenkro');
  UPDATE public.users SET constituency = 'Ajumako Enyan Esiam' WHERE lower(trim(constituency)) = lower('Ajumako-Enyan-Essiam');
  UPDATE public.users SET constituency = 'Komenda Edina Eguafo Abrem' WHERE lower(trim(constituency)) = lower('Komenda-Edina-Eguafo-Abirem');
  UPDATE public.users SET constituency = 'Twifo Atti Morkwa' WHERE lower(trim(constituency)) = lower('Twifo-Atii Morkwaa');
  UPDATE public.users SET constituency = 'Akuapem South' WHERE lower(trim(constituency)) = lower('Akwapim South');
  UPDATE public.users SET constituency = 'Kwahu Afram Plains North' WHERE lower(trim(constituency)) = lower('Afram Plains North');
  UPDATE public.users SET constituency = 'Lower Manya Krobo' WHERE lower(trim(constituency)) = lower('Lower Manya');
  UPDATE public.users SET constituency = 'Upper Manya Krobo' WHERE lower(trim(constituency)) = lower('Upper Manya');
  UPDATE public.users SET constituency = 'Ayawaso West Wuogon' WHERE lower(trim(constituency)) = lower('Ayawaso West');
  UPDATE public.users SET constituency = 'Bortianor-Ngleshie Amanfro' WHERE lower(trim(constituency)) = lower('Bortianor-Ngleshie-Amanfrom');
  UPDATE public.users SET constituency = 'Madina' WHERE lower(trim(constituency)) = lower('Abokobi-Madina');
  UPDATE public.users SET constituency = 'Weija-Gbawe' WHERE lower(trim(constituency)) = lower('Weija');
  UPDATE public.users SET constituency = 'Nalerigu / Gambaga' WHERE lower(trim(constituency)) = lower('Nalerigu');
  UPDATE public.users SET constituency = 'Bole-Bamboi' WHERE lower(trim(constituency)) = lower('Bole');
  UPDATE public.users SET constituency = 'Bolga East' WHERE lower(trim(constituency)) = lower('Bolgatanga East');
  UPDATE public.users SET constituency = 'Essikadu-Ketan' WHERE lower(trim(constituency)) = lower('Essikado-Ketan');
END $$;

-- 3. Update the network assignment trigger to support resilient matching
-- (stripping spaces, hyphens, slashes, and special characters)
CREATE OR REPLACE FUNCTION public.enforce_user_network_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_region text;
  v_constituency text;
  v_chapter text;
BEGIN
  new.platform := upper(trim(coalesce(new.platform, '')));

  IF new.platform NOT IN ('GHANA', 'DIASPORA') THEN
    RAISE check_violation USING message = 'Invalid member platform';
  END IF;

  new.country := nullif(trim(new.country), '');
  new.region := nullif(trim(new.region), '');
  new.constituency := nullif(trim(new.constituency), '');
  new.chapter := nullif(trim(new.chapter), '');

  -- Common logic: If a member (Ghana or Diaspora) has selected a constituency,
  -- validate it resilience-wise and auto-populate their region & canonical constituency name.
  IF new.constituency IS NOT NULL THEN
    SELECT gc.name, gr.name INTO v_constituency, v_region
    FROM public.ghana_constituencies gc
    JOIN public.ghana_regions gr ON gr.id = gc.region_id
    WHERE regexp_replace(lower(trim(gc.name)), '[^a-z0-9]', '', 'g') = regexp_replace(lower(trim(new.constituency)), '[^a-z0-9]', '', 'g')
    LIMIT 1;

    IF v_constituency IS NULL THEN
      RAISE check_violation USING message = 'Invalid Ghana constituency assignment';
    END IF;

    new.constituency := v_constituency;
    new.region := v_region;
  END IF;

  IF new.platform = 'GHANA' THEN
    IF new.chapter IS NOT NULL THEN
      RAISE check_violation USING message = 'Ghana members cannot use a chapter assignment';
    END IF;

    new.country := 'Ghana';
  ELSE
    -- DIASPORA
    IF lower(coalesce(new.country, '')) = 'ghana' THEN
      RAISE check_violation USING message = 'Diaspora members cannot use Ghana as country';
    END IF;

    IF new.chapter IS NOT NULL THEN
      SELECT c.name INTO v_chapter
      FROM public.chapters c
      WHERE lower(trim(c.name)) = lower(new.chapter)
        AND lower(coalesce(c.country, '')) <> 'ghana'
      LIMIT 1;

      IF v_chapter IS NULL THEN
        RAISE check_violation USING message = 'Invalid Diaspora chapter assignment';
      END IF;

      new.chapter := v_chapter;
    END IF;
  END IF;

  RETURN new;
END;
$$;
