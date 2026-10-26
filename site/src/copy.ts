// Every user-facing string lives here so translations can be added later.

export const STEPS = [
  { id: 'place', n: '01', label: 'Place' },
  { id: 'stories', n: '02', label: 'Voices' },
  { id: 'signals', n: '03', label: 'Signals' },
  { id: 'check', n: '04', label: 'Check' },
  { id: 'capital', n: '05', label: 'Money' },
  { id: 'priorities', n: '06', label: 'Priorities' },
] as const

export const QUESTIONS = {
  stories: 'Who spoke, and what did they say?',
  signals: 'What does it all add up to?',
  check: 'Do the people agree?',
  capital: 'Where should money go?',
  priorities: 'What comes first?',
} as const

export const HOW = {
  label: 'Show me how this works',
  stories:
    'Told in their own words — people are named by role only. Highlighted passages are the exact excerpts that feed signals; tap one to see where it lands.',
  signals:
    'Every signal traces back to the exact words in the record. Nothing is invented here.',
  check:
    'Nothing guides capital until the place has checked it. These counts come from recorded participation in the source systems — and here is how you would respond.',
  capital:
    'The same signals, structured two ways. A place can be funded as a list of separate projects — or as a place.',
} as const

export const answers = {
  roles: (roles: string[]) =>
    roles.length > 1
      ? `${roles.slice(0, -1).join(', ')} and ${roles[roles.length - 1]}`
      : (roles[0] ?? ''),
  stories: (n: number) => `${n} ${n === 1 ? 'person' : 'people'} spoke`,
  noStatement: 'No signals have been published yet.',
  checkEmpty: 'No signals have been published yet.',
  prioritiesEmpty: 'These are written last, after the place has been heard.',
  priorities: (n: number) => `${n} ${n === 1 ? 'priority' : 'priorities'}`,
} as const

export const place = {
  replay: 'Replay',
  jump: 'Scroll, or jump to',
  jumpStories: 'who spoke',
  jumpSignals: 'what it adds up to',
}

export const stepBar = {
  label: 'Steps',
  prev: 'Previous step',
  next: 'Next step',
  jump: 'Jump to a step',
}

export const journey = {
  next: 'Next place',
  all: 'All places',
  end: 'You have reached the end of this place.',
}

export const notFound = {
  title: 'We could not find that place',
  body: 'Pick one of the places below.',
}

export const landing = {
  marker: 'The Value Structuring Engine',
  headline: 'Every place knows what it needs.',
  sub: 'People tell stories about where they live. The engine keeps their exact words all the way through — to the signals a place agrees on, and to the decisions those signals guide.',
  cta: 'Explore a place',
  secondary: 'How it works',
  globeNote: 'Hover or focus a place to turn the globe to it.',
  why: 'Investment usually hears from consultants. This hears from the people who live there.',
  howTitle: 'How it works',
  threadTitle: 'Follow one sentence',
  threadIntro:
    'Nothing here is summarised. Every signal keeps the exact words it came from, so anyone can check the thread end to end.',
  threadQuote: 'The exact words',
  threadSignal: 'The place heard',
  threadIntervention: 'It guided',
  threadOpen: 'Still open, no decision attached yet',
  galleryTitle: 'Every place heard so far',
  dummyLabel: 'Dummy data · fictional example',
  realLabel: 'Real data',
  honesty:
    'Nine places are real — assembled from field records and clearly attributed public posts. Utopia is a fictional example, labelled dummy data wherever it appears. Nothing is priced against a community’s say; signals marked for the commons stay in the commons.',
  footer: 'Apache-2.0 · works offline',
  oss: 'Built from open-source software',
  ossUrl: 'https://github.com/TerexitariusStomp/vse' as string | null,
  storiesLabel: 'stories',
  signalsLabel: 'signals',
}
