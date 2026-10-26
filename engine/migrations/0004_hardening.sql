-- 0004: consent + PII gate (FR-E9 / NFR-2), pipeline observability,
-- participant provenance, query indexes.
--
-- consent: 'granted' (teller agreed — extraction + publication allowed),
--          'pending' (collected but not yet consented — held out of both),
--          'declined' (like pending, plus a signal to the analyst).
-- Existing rows backfill 'granted': they were collected under the
-- deployments' own consent practice; tightening them retroactively would
-- unpublish every live place. New web intake defaults 'pending' unless the
-- form posts consent explicitly — see intake.ts.
ALTER TABLE stories ADD COLUMN consent TEXT NOT NULL DEFAULT 'granted'
  CHECK (consent IN ('granted','pending','declined'));
ALTER TABLE stories ADD COLUMN pii_flag INTEGER NOT NULL DEFAULT 0;

-- DLQ/failure visibility: queue messages that exhaust retries land here so
-- the analyst console can see what died instead of dropping silently.
CREATE TABLE pipeline_failures (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  payload    TEXT NOT NULL,            -- the failed PipelineJob, as JSON
  error      TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- How the participant token was minted: 'session' (paper slip / shared
-- device) or 'link' (FR-E17 magic link). Aids check audits.
ALTER TABLE participants ADD COLUMN created_via TEXT NOT NULL DEFAULT 'session';

-- Query-path indexes the initial schema skipped.
CREATE INDEX votes_signal ON votes(signal_id);
CREATE INDEX stories_place_withdrawn ON stories(place_id, withdrawn);
CREATE INDEX sip_evidence_claim ON sip_evidence(claim_id);
CREATE INDEX intervention_signals_signal ON intervention_signals(signal_id);
