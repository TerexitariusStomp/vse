-- Provenance carried through to publication (results-file fields the
-- demonstrator renders): place geo/readings, per-story source refs.

ALTER TABLE places ADD COLUMN geo TEXT;      -- JSON: {lat, lon, label?}
ALTER TABLE places ADD COLUMN readings TEXT; -- JSON: [{label, value, source, methodologyRef?}]
ALTER TABLE stories ADD COLUMN source TEXT;  -- JSON: {system?, record?, url?}
