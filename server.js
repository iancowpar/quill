import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { VOICE_PROFILE } from './voice.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3001;
const MODEL = 'claude-sonnet-4-6';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and set the key.');
  process.exit(1);
}

const client = new Anthropic();

// Extract the assistant's final text content from a Messages response.
function extractText(message) {
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

// Pull the first JSON object/array out of a string, tolerating surrounding prose
// or ```json fences that the model occasionally adds despite instructions.
function parseJson(raw) {
  if (!raw) throw new Error('Empty model response');
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.search(/[\[{]/);
  if (start === -1) throw new Error('No JSON found in response');
  const slice = candidate.slice(start);
  // Walk until matching close — handles trailing prose.
  const open = slice[0];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < slice.length; i++) {
    const ch = slice[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        return JSON.parse(slice.slice(0, i + 1));
      }
    }
  }
  throw new Error('Unbalanced JSON in response');
}

// POST /api/scan — find what's trending across the writer's topics this week
// and return them with voice-matched angles.
app.post('/api/scan', async (req, res) => {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }],
      system: `${VOICE_PROFILE}

You are also the writer's research partner. You scan the web for what is
actually being discussed right now in: product management, AI adoption in
enterprise, product leadership, and tech workforce trends. You prefer signal
over noise — patterns, real shifts, things being debated, not press releases.`,
      messages: [
        {
          role: 'user',
          content: `Search the web for trending discussions on LinkedIn and the broader product/tech web from the past 7 days across:
- product management practice and the PM role
- AI adoption inside enterprises (especially the team layer, not the tool layer)
- product leadership and player-coach dynamics
- tech workforce trends (org design, layoffs, return-to-office, AI displacing or reshaping roles)

Find 5-7 topics with real momentum this week. For each, generate 2-3 post angles tailored to my voice and frameworks. Angles should NOT be generic takes. They should connect the trend to one of my pillars (AI adoption at the team layer, Zero-Translation Building, Network Intelligence Layer, player-coach leadership) when the connection is honest.

Angles MUST be framed as a premise, observation, reframe, or question — never as a first-person scene or claim about something that happened to me. Do not propose angles like "When my team rolled out X…" or "Last week I noticed…". I won't publish things that didn't happen. Examples of well-framed angles:
- "Why AI rollouts stall at the team layer, not the tool layer."
- "The PM's new job is to identify what people are waiting on."
- "What if the bottleneck isn't capacity, it's translation?"

Return ONLY a JSON array, no prose, no markdown fences. Schema:
[
  {
    "title": "short topic name",
    "summary": "1-2 sentences on what is happening and why it has momentum",
    "fit": "high" | "medium" | "low",
    "angles": ["angle 1 (premise/observation/question, not a first-person scene)", "angle 2", "angle 3"]
  }
]

"fit" is how well the topic maps to my content pillars. Be honest — not everything should be "high."`,
        },
      ],
    });

    const raw = extractText(message);
    const topics = parseJson(raw);
    res.json({ topics });
  } catch (err) {
    console.error('scan error:', err);
    res.status(500).json({ error: err.message || 'Scan failed' });
  }
});

// POST /api/angles — takes raw items the user pasted from their feed
// (post titles, topics, or URLs, one per entry) and returns the same
// topic-card shape as /api/scan, without running web search.
app.post('/api/angles', async (req, res) => {
  const { inputs } = req.body || {};
  const items = Array.isArray(inputs)
    ? inputs.map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (items.length === 0) {
    return res.status(400).json({ error: 'inputs must be a non-empty array' });
  }

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: `${VOICE_PROFILE}

You are the writer's research partner. The writer is going to hand you a list
of items they've seen trending in their LinkedIn feed: post titles, topic
phrases, or URLs. You will not search the web. Work from what they pasted.
URLs are clues about subject matter, not sources you can fetch.`,
      messages: [
        {
          role: 'user',
          content: `Here is what I'm seeing in my feed right now. For each item, return one topic card with 2-3 post angles tailored to my voice and frameworks. Connect to my pillars (AI adoption at the team layer, Zero-Translation Building, Network Intelligence Layer, player-coach leadership) only when the connection is honest. If an item is just a URL, infer the topic from the URL path and slug.

Angles MUST be framed as a premise, observation, reframe, or question — never as a first-person scene or claim about something that happened to me. Do not propose angles like "When my team rolled out X…" or "Last week I noticed…". I won't publish things that didn't happen.

My feed:
${items.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Return ONLY a JSON array, no prose, no markdown fences. Schema:
[
  {
    "title": "short topic name (5-8 words)",
    "summary": "1-2 sentences on what this item is about and why it has heat",
    "fit": "high" | "medium" | "low",
    "angles": ["angle 1 (premise/observation/question, not a first-person scene)", "angle 2", "angle 3"]
  }
]

"fit" is how well it maps to my content pillars. Be honest — not everything should be "high."`,
        },
      ],
    });

    const raw = extractText(message);
    const topics = parseJson(raw);
    res.json({ topics });
  } catch (err) {
    console.error('angles error:', err);
    res.status(500).json({ error: err.message || 'Angle generation failed' });
  }
});

// POST /api/draft — turn a topic + angle into a finished LinkedIn post.
// Optional `anchor`: a real moment from the writer to ground the opener.
// When omitted, the model is explicitly forbidden from inventing one.
app.post('/api/draft', async (req, res) => {
  const { topic, angle, anchor } = req.body || {};
  if (!topic || !angle) {
    return res.status(400).json({ error: 'topic and angle are required' });
  }

  const anchorText = typeof anchor === 'string' ? anchor.trim() : '';
  const openingInstruction = anchorText
    ? `OPENER: I have given you an ANCHOR below. Open the post directly from it.
Use it as ground truth. Do not embellish it with invented surrounding details
(no fabricated names, dialogue, room descriptions, or extra events I didn't
include). Take what I gave you, and move from there into the systemic point.

ANCHOR (in my own words, treat as fact):
"""
${anchorText}
"""`
    : `OPENER: I did NOT give you an anchor. You must NOT invent a first-person
scene, meeting, conversation, customer, or teammate. No "Last week I…",
no "I was talking to a PM…", no "A founder told me…". Open instead with
one of: (a) a pattern visible in the public discourse, (b) a direct
observation about how things work, (c) a question worth sitting with, or
(d) a reframe of a common assumption. Observation, not autobiography.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: VOICE_PROFILE,
      messages: [
        {
          role: 'user',
          content: `Write a LinkedIn post in my voice.

Trend: ${topic}
Angle: ${angle}

${openingInstruction}

Constraints:
- 150-250 words. Count them.
- Zoom from specific → systemic → human stakes.
- 1-2 line paragraphs with white space between them.
- End with a question or a small challenge.
- Follow every hard rule in the system prompt, especially the AUTHENTICITY rule.

Return ONLY the post text. No title. No commentary. No hashtags.`,
        },
      ],
    });

    const draft = extractText(message);
    res.json({ draft });
  } catch (err) {
    console.error('draft error:', err);
    res.status(500).json({ error: err.message || 'Draft failed' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, model: MODEL }));

app.listen(PORT, () => {
  console.log(`Quill API listening on http://localhost:${PORT} (model: ${MODEL})`);
});
