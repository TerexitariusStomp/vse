export interface GlossaryEntry {
  term: string
  plain: string
}

export const GLOSSARY = {
  story: {
    term: 'story',
    plain: 'Something a person said or wrote about their place, in their own words.',
  },
  excerpt: {
    term: 'excerpt',
    plain:
      'An exact piece of a story, copied word for word. Nothing is reworded or summarised.',
  },
  signal: {
    term: 'signal',
    plain:
      'A need or hope that comes up again and again across different excerpts. Signals are grouped from excerpts.',
  },
  peopleCheck: {
    term: 'people check',
    plain:
      'The people who told the stories are asked whether a signal is right. A signal only counts once they have had their say.',
  },
  endorse: {
    term: 'endorse',
    plain: 'To back a signal: "Yes, this is right."',
  },
  amend: {
    term: 'amend',
    plain: 'To say a signal is nearly right and suggest a change to it.',
  },
  contest: {
    term: 'contest',
    plain: 'To challenge a signal: "No, this is not right."',
  },
  commons: {
    term: 'commons',
    plain:
      'Things that belong to everyone, like clean air or a shared green. The place can mark a signal as commons so it is never given a price.',
  },
  priced: {
    term: 'priced',
    plain:
      'Given a money value so it can be funded or traded. Only needs the place agrees can carry a price are ever priced.',
  },
  intervention: {
    term: 'intervention',
    plain:
      'A concrete idea for where money or effort could go, tied back to the signals that call for it.',
  },
  capital: {
    term: 'capital',
    plain: 'Money and resources that can be put into a place.',
  },
  dummyData: {
    term: 'dummy data',
    plain: 'Made-up example data used to show how the engine works. It is not about a real place.',
  },
  verbatim: {
    term: 'verbatim',
    plain: 'Exactly as it was said, word for word.',
  },
} as const satisfies Record<string, GlossaryEntry>

export type GlossaryKey = keyof typeof GLOSSARY
