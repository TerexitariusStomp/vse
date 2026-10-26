-- 0003: claim provenance + story dedup.
-- proposer records who put a claim forward: 'model' (extraction),
-- 'fallback' (micro-story passthrough), 'analyst' (analyst-specified
-- verbatim span). The slice-equality gate applies identically to all three.
ALTER TABLE claims ADD COLUMN proposer TEXT NOT NULL DEFAULT 'model'
  CHECK (proposer IN ('model','analyst','fallback'));

-- Intake dedup: the same words in the same place are the same story
-- (two identical texts carry identical evidence weight). Earlier re-ingests
-- left duplicates — repoint their claims to the oldest row (identical text
-- → identical spans → lineage preserved), delete the extras, then index.
UPDATE claims SET story_id = (
  SELECT s2.id FROM stories s2
  JOIN stories s1 ON s1.id = claims.story_id
  WHERE s2.place_id = s1.place_id AND s2.text = s1.text
  ORDER BY s2.created_at, s2.id LIMIT 1)
WHERE story_id IN (
  SELECT s1.id FROM stories s1
  WHERE s1.id != (
    SELECT s2.id FROM stories s2
    WHERE s2.place_id = s1.place_id AND s2.text = s1.text
    ORDER BY s2.created_at, s2.id LIMIT 1));
DELETE FROM stories WHERE id IN (
  SELECT s1.id FROM stories s1
  WHERE s1.id != (
    SELECT s2.id FROM stories s2
    WHERE s2.place_id = s1.place_id AND s2.text = s1.text
    ORDER BY s2.created_at, s2.id LIMIT 1));
-- Repointing can collide claims (same story+text, different rows from
-- separate re-extractions) — fold them too; sip_evidence follows.
-- First drop evidence rows that would violate (sip_id, claim_id) once
-- their claim folds into an already-evidenced canonical claim.
DELETE FROM sip_evidence
WHERE EXISTS (
  SELECT 1 FROM claims c1
  WHERE c1.id = sip_evidence.claim_id
    AND c1.id != (
      SELECT c2.id FROM claims c2
      WHERE c2.story_id = c1.story_id AND c2.text = c1.text AND c2.status = c1.status
      ORDER BY c2.created_at, c2.id LIMIT 1)
    AND EXISTS (
      SELECT 1 FROM sip_evidence se2
      WHERE se2.sip_id = sip_evidence.sip_id
        AND se2.claim_id = (
          SELECT c4.id FROM claims c4
          WHERE c4.story_id = c1.story_id AND c4.text = c1.text AND c4.status = c1.status
          ORDER BY c4.created_at, c4.id LIMIT 1)));
UPDATE sip_evidence SET claim_id = (
  SELECT c2.id FROM claims c2
  JOIN claims c1 ON c1.id = sip_evidence.claim_id
  WHERE c2.story_id = c1.story_id AND c2.text = c1.text AND c2.status = c1.status
  ORDER BY c2.created_at, c2.id LIMIT 1)
WHERE claim_id IN (
  SELECT c1.id FROM claims c1
  WHERE c1.id != (
    SELECT c2.id FROM claims c2
    WHERE c2.story_id = c1.story_id AND c2.text = c1.text AND c2.status = c1.status
    ORDER BY c2.created_at, c2.id LIMIT 1));
DELETE FROM claims WHERE id IN (
  SELECT c1.id FROM claims c1
  WHERE c1.id != (
    SELECT c2.id FROM claims c2
    WHERE c2.story_id = c1.story_id AND c2.text = c1.text AND c2.status = c1.status
    ORDER BY c2.created_at, c2.id LIMIT 1));
CREATE UNIQUE INDEX stories_place_text ON stories(place_id, text);
