-- VSE engine schema (D1/SQLite). PRD §7.1.
-- Every derived entity keeps a path back to verbatim story text.

CREATE TABLE places (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'place',
  summary     TEXT NOT NULL DEFAULT '',
  scale_note  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE stories (
  id          TEXT PRIMARY KEY,
  place_id    TEXT NOT NULL REFERENCES places(id),
  teller_role TEXT NOT NULL,           -- role, never a name (BC-6)
  channel     TEXT NOT NULL,           -- whatsapp | voice | web | facilitated
  text        TEXT NOT NULL,
  r2_key      TEXT,                    -- source audio, if any
  withdrawn   INTEGER NOT NULL DEFAULT 0, -- teller data-rights (FR-E26)
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX stories_place ON stories(place_id);

CREATE TABLE signals (
  id          TEXT PRIMARY KEY,
  place_id    TEXT NOT NULL REFERENCES places(id),
  statement   TEXT NOT NULL,
  -- candidate → checking → checked → published; contested is a flag, not a stage
  status      TEXT NOT NULL DEFAULT 'candidate'
              CHECK (status IN ('candidate','checking','checked','published')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX signals_place ON signals(place_id);

CREATE TABLE claims (
  id           TEXT PRIMARY KEY,
  place_id     TEXT NOT NULL REFERENCES places(id),
  story_id     TEXT NOT NULL REFERENCES stories(id),
  signal_id    TEXT REFERENCES signals(id),
  text         TEXT NOT NULL,          -- must slice-equal story.text[span] (BC-2)
  span_start   INTEGER NOT NULL,
  span_end     INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'proposed'
               CHECK (status IN ('proposed','verified','quarantined')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX claims_story ON claims(story_id);
CREATE INDEX claims_signal ON claims(signal_id);

-- People check. Participants are opaque tokens (FR-E14 lightweight identity;
-- facilitated sessions mint one token per paper slip / device session).
CREATE TABLE participants (
  id         TEXT PRIMARY KEY,
  place_id   TEXT NOT NULL REFERENCES places(id),
  kind       TEXT NOT NULL DEFAULT 'pseudonymous',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE votes (
  participant_id TEXT NOT NULL REFERENCES participants(id),
  signal_id      TEXT NOT NULL REFERENCES signals(id),
  vote           TEXT NOT NULL CHECK (vote IN ('endorse','amend','contest')),
  amendment      TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (participant_id, signal_id)
);

-- Gate state per signal. commons_only is sticky: once a place says "never
-- price this", a later update cannot flip it back (BC-5 / gate G10).
CREATE TABLE gates (
  signal_id  TEXT PRIMARY KEY REFERENCES signals(id),
  gate       TEXT NOT NULL CHECK (gate IN ('may_be_priced','commons_only','not_yet')),
  set_by     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER commons_sticky BEFORE UPDATE ON gates
WHEN OLD.gate = 'commons_only' AND NEW.gate = 'may_be_priced'
BEGIN
  SELECT RAISE(ABORT, 'commons_only is sticky — cannot be repriced');
END;

CREATE TABLE sips (
  id            TEXT PRIMARY KEY,
  place_id      TEXT NOT NULL REFERENCES places(id),
  kind          TEXT NOT NULL CHECK (kind IN ('threshold','node','window')),
  title         TEXT NOT NULL,
  what_changes  TEXT NOT NULL,
  time_to_show  TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE sip_evidence (
  sip_id   TEXT NOT NULL REFERENCES sips(id),
  claim_id TEXT NOT NULL REFERENCES claims(id),
  PRIMARY KEY (sip_id, claim_id)
);

CREATE TABLE interventions (
  id       TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id),
  view     TEXT NOT NULL CHECK (view IN ('from_plans','from_place')),
  name     TEXT NOT NULL,
  note     TEXT NOT NULL DEFAULT '',
  sip_id   TEXT REFERENCES sips(id),
  priced   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE intervention_signals (
  intervention_id TEXT NOT NULL REFERENCES interventions(id),
  signal_id       TEXT NOT NULL REFERENCES signals(id),
  role            TEXT NOT NULL DEFAULT 'answer' CHECK (role IN ('answer','counter')),
  PRIMARY KEY (intervention_id, signal_id)
);

-- One row per published results file; the artifact lives in R2 with a
-- sha256 manifest so anyone can replay-verify it (gate G8).
CREATE TABLE publications (
  id              TEXT PRIMARY KEY,
  place_id        TEXT NOT NULL REFERENCES places(id),
  version         TEXT NOT NULL,
  manifest_sha256 TEXT NOT NULL,
  r2_key          TEXT NOT NULL,
  published_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
