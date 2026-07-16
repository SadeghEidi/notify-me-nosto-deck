/* ============================================================
   Live walkthrough — the OusMous factory builds Hueshi.
   A VS Code window animates through the 7 production-line stations
   (Research → Design → Engineering → Production → Testing →
   Delivery → Learning), building "Ask Hushi", our in-app AI copilot.

   On slide enter, the first station plays its build animation, then LOOPS
   that animation in place. Stations never auto-advance — each step keeps
   replaying until the presenter passes it manually:
     click / → / space / PageDown / s  → advance to the next station
     r                                 → replay from the first station
   After the last station, click / → leaves the slide normally (reveal.js).
   ?qa or reduced-motion               → renders the finished state, no timers.
   ============================================================ */
(function () {
  'use strict';

  var SLIDE = document.getElementById('walkthrough');
  if (!SLIDE) return;

  var STATIC = document.documentElement.classList.contains('qa') ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- tiny helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function node(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  var STAR = '<svg class="star" viewBox="0 0 24 24"><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

  function fileIcon(t) {
    var col = { md: '#6AA6FF', py: '#5FD0A6', ts: '#6AA6FF', tsx: '#6AA6FF', json: '#E6C07B' }[t] || '#8B94A8';
    if (t === 'dir' || t === 'diro') {
      return '<span class="fi" style="color:#7d879b"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" opacity=".9"/></svg></span>';
    }
    return '<span class="fi" style="color:' + col + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg></span>';
  }

  /* ============================================================
     Syntax highlighter — line-based, sticky-regex scanner.
     Snippets deliberately avoid multi-line strings/comments.
     ============================================================ */
  var RULES = {
    md: [
      [/#{1,6}\s.*/y, 'head'], [/^\s*>\s.*/y, 'dim'], [/^\s*-\s\[[ x]\]/y, 'str'],
      [/^\s*[-*]\s/y, 'punc'], [/`[^`]+`/y, 'str'], [/\*\*[^*]+\*\*/y, 'bold'],
      [/\[[^\]]+\]\([^)]+\)/y, 'tag'], [/->|=>/y, 'punc'], [/[A-Za-z0-9_$#.'"/()]+/y, 'txt']
    ],
    py: [
      [/#.*/y, 'com'], [/(?:f|r|rf|fr)?"(?:[^"\\]|\\.)*"|(?:f|r)?'(?:[^'\\]|\\.)*'/y, 'str'],
      [/@\w+/y, 'fn'], [/(?<=\bdef\s)\w+/y, 'fn'], [/(?<=\bclass\s)\w+/y, 'fn'],
      [/\b(?:def|class|return|import|from|as|if|elif|else|for|while|in|not|and|or|None|True|False|with|try|except|raise|await|async|lambda|yield|pass|is|global|await)\b/y, 'key'],
      [/\b\d[\d_.]*\b/y, 'num'], [/\w+(?=\()/y, 'fn'], [/[{}()\[\].,:;=+\-*/%<>!&|]+/y, 'punc'], [/\w+/y, 'txt']
    ],
    ts: [
      [/\/\/.*/y, 'com'], [/`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/y, 'str'],
      [/<\/?[A-Za-z][\w.]*/y, 'tag'],
      [/\b(?:const|let|var|function|return|import|export|from|type|interface|extends|new|await|async|if|else|for|of|in|while|class|public|private|readonly|as|default|switch|case|break|null|undefined|true|false|this|void|yield)\b/y, 'key'],
      [/\b[\w-]+(?=\s*=\s*[{"'])/y, 'attr'], [/\b\d[\d_.]*\b/y, 'num'],
      [/\b[A-Z]\w*/y, 'tag'], [/\w+(?=\()/y, 'fn'], [/=>|[{}()\[\].,:;=+\-*/%<>!&|?]+/y, 'punc'], [/[\w$]+/y, 'txt']
    ]
  };
  RULES.tsx = RULES.ts;

  function hlLine(lang, line) {
    var rules = RULES[lang]; if (!rules) return esc(line);
    var out = '', i = 0, guard = 0;
    while (i < line.length && guard++ < 4000) {
      var matched = false;
      for (var r = 0; r < rules.length; r++) {
        var re = rules[r][0]; re.lastIndex = i;
        var m = re.exec(line);
        if (m && m.index === i && m[0].length) {
          var cls = rules[r][1];
          out += cls === 'txt' ? esc(m[0]) : '<span class="tk-' + cls + '">' + esc(m[0]) + '</span>';
          i += m[0].length; matched = true; break;
        }
      }
      if (!matched) { out += esc(line[i]); i++; }
    }
    return out;
  }
  function hl(lang, code) { return code.split('\n').map(function (l) { return hlLine(lang, l); }); }

  /* ============================================================
     File tree
     ============================================================ */
  var TREE = [
    { id: 'dclaude', d: 0, t: 'diro', name: '.claude', tail: 'skills · agents · hooks' },
    { id: 'hoo', d: 0, t: 'diro', name: 'Hooshang' },
    { id: 'hoo_pipe', d: 1, t: 'diro', name: 'pipeline' },
    { id: 'bf', d: 2, t: 'py', name: 'build_features.py', hidden: 1, app: 'production' },
    { id: 'hoo_tools', d: 1, t: 'diro', name: 'tools' },
    { id: 'doss', d: 2, t: 'py', name: 'dossier.py' },
    { id: 'hoo_hand', d: 1, t: 'md', name: 'HANDOFF.md' },
    { id: 'docs', d: 0, t: 'diro', name: 'notify-me-docs' },
    { id: 'research', d: 1, t: 'md', name: 'research.md', hidden: 1, app: 'research' },
    { id: 'prd', d: 1, t: 'md', name: 'prd.md', hidden: 1, app: 'engineering' },
    { id: 'handoff', d: 1, t: 'md', name: 'handoff.md', hidden: 1, app: 'design' },
    { id: 'play', d: 0, t: 'diro', name: 'nm-design-playground-b' },
    { id: 'guide', d: 1, t: 'md', name: 'Hueshi-Guidelines.md', hidden: 1, app: 'design' },
    { id: 'orb', d: 1, t: 'tsx', name: 'HueshiOrb.tsx', hidden: 1, app: 'design' },
    { id: 'be', d: 0, t: 'diro', name: 'restockify-backend' },
    { id: 'engine', d: 1, t: 'py', name: 'hushi/engine.py', hidden: 1, app: 'production' },
    { id: 'fe', d: 0, t: 'diro', name: 'restockify-frontend' },
    { id: 'chat', d: 1, t: 'tsx', name: 'hushi/ChatPanel.tsx', hidden: 1, app: 'production' },
    { id: 'chlog', d: 1, t: 'md', name: 'CHANGELOG.md', hidden: 1, app: 'delivery' },
    { id: 'claudemd', d: 0, t: 'md', name: 'CLAUDE.md' }
  ];

  /* ============================================================
     The 7 scenes
     ============================================================ */
  function L(b, x) { return { b: b, x: x }; }             // agent log line
  function T(fn, arg, out) { return { tool: 1, fn: fn, arg: arg, out: out }; } // tool call
  function H(x) { return { hook: 1, x: x }; }             // hook note
  function R(f, note, tone) { return { report: 1, f: f, note: note, tone: tone || '' }; }

  var STEPS = [
    /* ===== RESEARCH — new feature -> crawl -> research.md -> PRD -> tweak ===== */
    {
      key: 'research', name: 'Research', sub: 'Market · PRD', ac: 'blue',
      notes: ['Market Research Station', 'PRD Station · Product Requirements'],
      beats: [
        { // 1 · kickoff + web crawl
          status: 'skill: market-research', lang: 'Markdown',
          tabs: [{ n: 'research.md', t: 'md', on: 1 }], crumb: ['notify-me-docs', 'hushi', 'research.md'],
          active: 'research', show: ['research'], editorLang: 'md',
          code:
            '# Hueshi — Market Research\n' +
            '\n' +
            '> New feature: an in-app AI copilot for Notify Me demand data.\n' +
            '\n' +
            '## Signal\n' +
            'Merchants sit on rich demand data (back-in-stock, wishlist,\n' +
            'pre-order, low-stock) but have no way to **ask** it.\n' +
            '\n' +
            '_compiling market context…_',
          preview: { type: 'crawl', tally: '14 sources · 6 insights · 3 competitors', sources: [
            { u: 'shopify.dev/docs/sidekick', state: 'done' },
            { u: 'nosto.com/ai-commerce', state: 'done' },
            { u: 'baymard.com/ecommerce-search', state: 'done' },
            { u: 'a16z.com/ask-your-data', state: 'live' },
            { u: 'gartner.com/saas-copilots', state: 'live' }
          ] },
          ask: 'Let us start a new feature: Hueshi, our in-app AI copilot. Research the opportunity.',
          agent: [
            T('Skill', 'market-research', 'SOP loaded'),
            L('crawl', 'gathering market + competitor context from the web'),
            T('WebSearch', 'ask-your-data commerce chat', 'trend + 3 competitors'),
            T('WebFetch', 'shopify.dev/sidekick', 'limit: no BIS / wishlist access'),
            L('moat', '30k shops of history -> **peer benchmarks**')
          ]
        },
        { // 2 · research.md compiled
          status: 'skill: market-research', lang: 'Markdown',
          tabs: [{ n: 'research.md', t: 'md', on: 1 }], crumb: ['notify-me-docs', 'hushi', 'research.md'],
          active: 'research', show: ['research'], editorLang: 'md',
          code:
            '# Hueshi — Market Research\n' +
            '\n' +
            '## Signal\n' +
            'Merchants can\'t **ask** their demand data — they read 4 reports.\n' +
            '\n' +
            '## Market\n' +
            '- "Ask-your-data" chat is now a baseline SaaS expectation\n' +
            '- Shopify Sidekick trained the habit, but can\'t see our data\n' +
            '- 30k shops of cross-shop history -> **peer benchmarks** (moat)\n' +
            '\n' +
            '## Recommendation\n' +
            'An in-app copilot: grounded, cited answers + a next action.',
          preview: { type: 'doc', title: 'research.md', blocks: [
            { h: 'Signal' }, { p: 'Demand data is trapped in dashboards.' },
            { h: 'Market' }, { ul: ['Ask-your-data is now expected', 'Sidekick can\'t see our data', '30k shops -> peer benchmarks'] },
            { h: 'Recommendation' }, { p: 'In-app copilot: **grounded + cited**.' }
          ] },
          agent: [
            T('Write', 'research.md', 'market + opportunity, 14 sources'),
            R('research.md', 'compiled · PRD-ready', 'blue')
          ]
        },
        { // 3 · PRD creation from research.md
          status: 'skill: prd', lang: 'Markdown',
          tabs: [{ n: 'research.md', t: 'md' }, { n: 'prd.md', t: 'md', on: 1 }], crumb: ['notify-me-docs', 'hushi', 'prd.md'],
          active: 'prd', show: ['prd'], editorLang: 'md',
          code:
            '# Hueshi — PRD (in-app copilot)\n' +
            '\n' +
            '## Problem\n' +
            'Demand signal is trapped in dashboards. Merchants can\'t ask it.\n' +
            '\n' +
            '## Users & Jobs\n' +
            'Merchant admin (all plans). Ask a plain-language question ->\n' +
            'grounded, cited answer with a recommended action.\n' +
            '\n' +
            '## Capabilities\n' +
            '- [x] Streamed, cited answers over own data\n' +
            '- [x] Opt-in peer benchmarks (k-anon cohorts)\n' +
            '- [x] Grounded-or-abstain — never fabricate a metric\n' +
            '- [x] Action-taking with approval + Undo',
          preview: { type: 'doc', title: 'prd.md', blocks: [
            { h: 'Problem' }, { p: 'Signal trapped in dashboards.' },
            { h: 'Capabilities' }, { chk: [[1, 'Streamed, cited answers'], [1, 'Opt-in peer benchmarks'], [1, 'Grounded-or-abstain'], [1, 'Action-taking + Undo']] },
            { h: 'Rollout' }, { p: 'All plans · hushi_chat %' }
          ] },
          ask: 'Now turn research.md into a PRD.',
          agent: [
            T('Skill', 'prd', 'SOP loaded'),
            T('Read', 'research.md', 'grounding the PRD'),
            T('Write', 'prd.md', 'problem · users · capabilities · rollout')
          ]
        },
        { // 4 · PRD ready + tweak
          status: 'skill: prd', lang: 'Markdown',
          tabs: [{ n: 'prd.md', t: 'md', on: 1 }], crumb: ['notify-me-docs', 'hushi', 'prd.md'],
          active: 'prd', show: ['prd'], editorLang: 'md',
          code:
            '# Hueshi — PRD (in-app copilot)\n' +
            '\n' +
            '## Capabilities  (v1 = read-and-advise)\n' +
            '- [x] Streamed, cited answers over own data\n' +
            '- [x] Opt-in peer benchmarks (k-anon cohorts)\n' +
            '- [x] Grounded-or-abstain — never fabricate a metric\n' +
            '- [ ] Action-taking with approval + Undo   (phase 2)\n' +
            '\n' +
            '## Rollout\n' +
            'All plans · gradual % rollout behind `hushi_chat`.\n' +
            '> Reviewed with PM — scoped v1, ready for design.',
          preview: { type: 'doc', title: 'prd.md', blocks: [
            { h: 'Capabilities · v1' }, { chk: [[1, 'Cited answers'], [1, 'Peer benchmarks'], [1, 'Grounded-or-abstain'], [0, 'Action-taking (phase 2)']] },
            { h: 'Rollout' }, { p: 'All plans · hushi_chat %' },
            { h: 'Status' }, { p: '**Ready for design**' }
          ] },
          ask: 'Scope v1 to read-and-advise; move action-taking to phase 2.',
          agent: [
            T('Edit', 'prd.md', 'action-taking -> phase 2'),
            R('prd.md', 'approved · ready for design', 'blue')
          ]
        }
      ]
    },

    /* ===== DESIGN — design from PRD -> live playground -> tweak -> handoff ===== */
    {
      key: 'design', name: 'Design', sub: 'UI/UX · Review · Handoff', ac: 'coral',
      notes: ['UI/UX Design Station', 'Design Review Station', 'Design Handoff Station'],
      beats: [
        { // 1 · design from PRD + live playground
          status: 'skill: design', lang: 'TypeScript JSX',
          tabs: [{ n: 'HueshiOrb.tsx', t: 'tsx', on: 1 }], crumb: ['nm-design-playground-b', 'components', 'HueshiOrb.tsx'],
          active: 'orb', show: ['guide', 'orb'], editorLang: 'tsx',
          code:
            '// Hueshi launcher — coral star in a glass orb\n' +
            'export function HueshiOrb() {\n' +
            '  return (\n' +
            '    <button className="hushi-fab">\n' +
            '      <span className="orb"><Star points={4} /></span>\n' +
            '      <Badge tone="coral">Beta</Badge>\n' +
            '    </button>\n' +
            '  )\n' +
            '}',
          preview: { type: 'hushi', variant: 'v1' },
          ask: 'Design the Hueshi launcher and chat from the PRD. Give me a live playground.',
          agent: [
            T('Skill', 'design', 'SOP loaded'),
            T('Task', 'product-designer', 'subagent dispatched'),
            T('Read', 'prd.md', 'capabilities + rollout'),
            L('build', 'Figma Make + Polaris · glassmorphism'),
            T('Write', 'HueshiOrb.tsx', 'coral orb + 4-pt star')
          ]
        },
        { // 2 · tweak -> merged FAB
          status: 'skill: design', lang: 'TypeScript JSX',
          tabs: [{ n: 'HueshiFab.tsx', t: 'tsx', on: 1 }], crumb: ['nm-design-playground-b', 'components', 'HueshiFab.tsx'],
          active: 'orb', show: ['orb'], editorLang: 'tsx',
          code:
            '// Merged launcher: Hueshi + Intercom\n' +
            'export function HueshiFab() {\n' +
            '  return (\n' +
            '    <div className="fab-merged" onHover={split}>\n' +
            '      <span className="orb hushi"><Star/></span>\n' +
            '      <span className="orb intercom" />\n' +
            '      <Badge tone="coral">Beta</Badge>\n' +
            '    </div>\n' +
            '  )\n' +
            '}',
          preview: { type: 'hushi', variant: 'v2' },
          ask: 'Merge the launcher with Intercom; split on hover, keep the Beta pill.',
          agent: [
            T('Edit', 'HueshiFab.tsx', 'merged FAB + hover split'),
            L('review', 'coral Hueshi rises over the blue Intercom base')
          ]
        },
        { // 3 · design handoff
          status: 'skill: design-handoff', lang: 'Markdown',
          tabs: [{ n: 'handoff.md', t: 'md', on: 1 }], crumb: ['notify-me-docs', 'hushi', 'handoff.md'],
          active: 'handoff', show: ['handoff'], editorLang: 'md',
          code:
            '# Hueshi — Design Handoff\n' +
            '\n' +
            '## Launcher\n' +
            'Merged FAB, bottom-right. Idle: one coral→blue orb.\n' +
            'Hover: coral Hueshi rises, base -> blue Intercom.\n' +
            '\n' +
            '## Tokens\n' +
            '--hushi: #EE442E -> #F26E5D · radius 100px\n' +
            'Panel: glass, blur 8px, Polaris card frame\n' +
            '\n' +
            '## States\n' +
            'default · hover · open · streaming · error',
          preview: { type: 'handoff' },
          ask: 'Looks good. Create the design handoff for the developers.',
          agent: [
            T('Write', 'handoff.md', 'specs · tokens · states'),
            R('handoff.md', 'delivered -> engineering', 'coral')
          ]
        }
      ]
    },

    /* ===== ENGINEERING (single beat — full scenario TBD) ===== */
    {
      key: 'engineering', name: 'Engineering', sub: 'DoD · Planning · Reviews', ac: 'blue',
      notes: ['Technical Definition of Done Station', 'Technical DoD Review Station', 'Technical Planning Station', 'Technical Plan Review Station'],
      beats: [{
        status: 'skill: engineering-plan', lang: 'Markdown',
        tabs: [{ n: 'prd.md', t: 'md' }, { n: 'plan.md', t: 'md', on: 1 }], crumb: ['notify-me-docs', 'hushi', 'plan.md'],
        active: 'prd', show: ['prd'], editorLang: 'md',
        code:
          '# Hueshi — Engineering plan\n' +
          '\n' +
          'Two planes, one seam:\n' +
          '  jaam warehouse   ->  pipeline/ (Foundry)  ->  tools/ (Analyst)\n' +
          '  BigQuery, read-only  build PII-free marts     answer, $0, offline\n' +
          '\n' +
          'Contract: **answer-bundle** { text, citations[], benchmark?, action? }\n' +
          'Invariant: shop_id injected server-side · zero cross-tenant leakage\n' +
          '\n' +
          '## Definition of Done\n' +
          '- [x] grounded-or-abstain — never fabricate a metric\n' +
          '- [x] every number cites its source report\n' +
          '- [x] benchmarks gated on opt-in consent',
        ask: 'Draft the engineering plan and Definition of Done.',
        agent: [
          T('Skill', 'engineering-plan', 'SOP loaded'),
          T('Read', 'prd.md', 'capabilities + rollout'),
          L('shape', 'two planes — Foundry marts -> Analyst answers'),
          H('guard: shop_id server-side — zero leakage'),
          R('plan.md', 'DoD approved', 'blue')
        ]
      }]
    },

    /* ===== PRODUCTION (single beat — full scenario TBD) ===== */
    {
      key: 'production', name: 'Production', sub: 'Coding · Review', ac: 'blue',
      notes: ['Coding Station', 'Code Review Station'],
      beats: [{
        status: 'agents: backend · frontend · sdk', lang: 'Python', term: 1,
        tabs: [{ n: 'engine.py', t: 'py', on: 1 }, { n: 'ChatPanel.tsx', t: 'tsx' }], crumb: ['restockify-backend', 'hushi', 'engine.py'],
        active: 'engine', show: ['bf', 'engine', 'chat'], editorLang: 'py',
        code:
          '# restockify-backend/hushi/engine.py\n' +
          'from hushi.marts import load_dossier\n' +
          'from hushi.contract import AnswerBundle\n' +
          '\n' +
          'async def answer(shop_id: int, question: str) -> AnswerBundle:\n' +
          '    dossier = load_dossier(shop_id)          # pre-baked, PII-free\n' +
          '    facts = ground(question, dossier)        # own-data first\n' +
          '    if not facts.grounded:\n' +
          '        return AnswerBundle.abstain(facts.reason)\n' +
          '    peers = benchmark(shop_id) if consented(shop_id) else None\n' +
          '    return AnswerBundle(narrate(facts, peers),\n' +
          '                        citations=facts.sources,\n' +
          '                        action=recommend(facts))',
        term: [
          { p: '~/Hooshang', c: 'python pipeline/build_features.py --explain' },
          { o: 'scan est. 0.4 GB · under budget ✓ → marts: 30,412 shops', cls: 'ok' },
          { p: 'restockify-frontend', c: 'pnpm build' },
          { o: 'chat surface built in 4.2s · recharts + Polaris', cls: 'o' }
        ],
        ask: 'Build the answer engine and the chat panel.',
        agent: [
          T('Task', 'backend · frontend · sdk', 'subagents dispatched'),
          T('Edit', 'hushi/engine.py', 'answer-bundle from marts'),
          T('Edit', 'ChatPanel.tsx', 'streamed · cited answers'),
          L('code-review', 'reviewer agent -> approved'),
          R('3 files', 'BE + FE + SDK', 'blue')
        ]
      }]
    },

    /* ===== TESTING (single beat — full scenario TBD) ===== */
    {
      key: 'testing', name: 'Testing', sub: 'Technical · Product · Visual', ac: 'mint',
      notes: ['Technical QA Station', 'Product QA Station', 'Visual QA Station'],
      beats: [{
        status: 'skill: qa', lang: 'Python', term: 1,
        tabs: [{ n: 'engine.py', t: 'py' }, { n: 'test_engine.py', t: 'py', on: 1 }], crumb: ['restockify-backend', 'hushi', 'test_engine.py'],
        active: 'engine', show: ['engine'], editorLang: 'py',
        code:
          'def test_abstains_when_ungrounded():\n' +
          '    r = answer(shop_id=7724, question="what\'s the weather?")\n' +
          '    assert r.abstained and r.citations == []\n' +
          '\n' +
          'def test_never_leaks_across_tenants():\n' +
          '    r = answer(shop_id=7724, question="top variant?")\n' +
          '    assert all(c.shop_id == 7724 for c in r.citations)\n' +
          '\n' +
          'def test_benchmark_needs_consent():\n' +
          '    assert answer(no_consent, "vs peers?").benchmark is None',
        term: [
          { p: '~/hushi', c: 'pytest -q' },
          { o: '............................  48 passed in 3.1s', cls: 'ok' },
          { p: '~/hushi', c: 'python audit.py --shops 21' },
          { o: 'grounded 21/21 · citations 21/21 · leaks 0 ✓', cls: 'ok' },
          { o: 'visual QA: 3 snapshots matched · Polaris frame ✓', cls: 'o' }
        ],
        ask: 'Add tests and run the accuracy audit.',
        agent: [
          T('Skill', 'qa', 'SOP loaded'),
          T('Bash', 'pytest -q', '48 passed'),
          T('Bash', 'audit.py --shops 21', '21/21 grounded · 0 leaks'),
          H('verify-on-stop: evidence required -> ✓'),
          R('QA green', 'tech · product · visual', 'mint')
        ]
      }]
    },

    /* ===== DELIVERY & LEARNING (single beat — full scenario TBD) ===== */
    {
      key: 'delivery', name: 'Delivery & Learning', sub: 'Release · Docs · Learning', ac: 'mint',
      notes: ['Release Station', 'Release Announcement Station', 'Documentation Station', 'Learning Station'],
      beats: [{
        status: 'skill: release', lang: 'Markdown', term: 1,
        tabs: [{ n: 'CHANGELOG.md', t: 'md', on: 1 }], crumb: ['restockify-frontend', 'CHANGELOG.md'],
        active: 'chlog', show: ['chlog'], editorLang: 'md',
        code:
          '# Changelog\n' +
          '\n' +
          '## Hueshi — your in-app copilot (Beta)\n' +
          'Ask plain-language questions about your demand data and get\n' +
          'grounded, cited answers — plus a recommended next step.\n' +
          '\n' +
          '- Available on **all plans** · gradual % rollout\n' +
          '- Opt-in **benchmark program** unlocks peer comparisons\n' +
          '- Reach it from the launcher or the homepage widget',
        term: [
          { p: '~/hushi', c: 'git commit -m "feat(hushi): in-app copilot v1"' },
          { p: '~/hushi', c: 'gh pr merge 482 --squash' },
          { o: '✓ PR #482 merged to main', cls: 'ok' },
          { p: '~/hushi', c: 'flags set hushi_chat --rollout 5% --plans all' },
          { o: '✓ live · 5% of shops · ramping', cls: 'ok' }
        ],
        ask: 'Ship Hueshi and ramp the rollout flag.',
        agent: [
          T('Bash', 'gh pr merge 482', 'squashed to main'),
          T('Bash', 'flags set hushi_chat 5%', 'live · all plans'),
          L('advice_ledger', 'predicted $ vs actual outcome'),
          { chart: 1 },
          R('shipped + learning', 'the factory loops back', 'mint')
        ]
      }]
    }
  ];

  /* ============================================================
     Renderers for one step
     ============================================================ */
  /* one Claude-Code action: ⏺ Tool(arg)  ⎿ result */
  function toolCallHTML(fn, arg, out) {
    return '<div class="cl-act">' +
      '<div class="cl-line"><span class="cl-dot"></span><span class="cl-call"><b>' + esc(fn) + '</b>' +
      '<span class="cl-paren">(</span><span class="cl-arg">' + esc(arg) + '</span><span class="cl-paren">)</span></span></div>' +
      (out ? '<div class="cl-res"><span class="cl-el"></span><span>' + esc(out) + '</span></div>' : '') + '</div>';
  }
  // the orchestrator delegating: rendered as real Claude Code Skill()/Task() calls
  function routeEntries(rt) {
    var e = [];
    if (rt.skill) e.push(toolCallHTML('Skill', rt.skill.replace('skill: ', ''), 'SOP loaded'));
    if (rt.agent) e.push(toolCallHTML('Task', rt.agent, 'subagent dispatched'));
    return e;
  }
  function agentItemHTML(it) {
    if (it.tool) return toolCallHTML(it.fn, it.arg, it.out);
    if (it.hook) return '<div class="cl-hook"><span class="cl-el"></span><span class="cl-hk">hook</span><span class="cl-hx">' + esc(it.x) + '</span></div>';
    if (it.report) return '<div class="cl-done ' + (it.tone || '') + '"><span class="cl-ck">' + CHECK + '</span><span><b>' + esc(it.f) + '</b> · ' + esc(it.note) + '</span></div>';
    if (it.chart) return '<div class="ag-chart">' + [18, 30, 26, 44, 52, 70].map(function (h, i) { return '<span class="bar' + (i > 3 ? ' up' : '') + '" data-h="' + h + '"></span>'; }).join('') + '</div>';
    // assistant reasoning line — ⏺ text
    return '<div class="cl-act text"><div class="cl-line"><span class="cl-dot"></span><span>' + boldify('<b>' + esc(it.b) + '</b> ' + esc(it.x)) + '</span></div></div>';
  }
  function boldify(s) { return s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }
  function askHTML(ask) { return '<div class="cl-user"><span class="cl-gt">&gt;</span><span>' + esc(ask) + '</span></div>'; }

  /* ---- live preview pane, one renderer per beat type ---- */
  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg>';
  function renderPreview(p) {
    if (!p) return '';
    if (p.type === 'hushi') return previewHushi(p.variant);
    if (p.type === 'crawl') return previewCrawl(p.sources, p.tally);
    if (p.type === 'doc') return previewDoc(p.title, p.blocks);
    if (p.type === 'handoff') return previewHandoff();
    return '';
  }
  function previewCrawl(sources, tally) {
    var rows = (sources || []).map(function (s) {
      var ic = s.state === 'done' ? '<span class="cr-ck">' + CHECK + '</span>' : '<span class="cr-sp"></span>';
      return '<div class="cr-row ' + s.state + '"><span class="cr-fav">' + GLOBE + '</span><span class="cr-u">' + esc(s.u) + '</span>' + ic + '</div>';
    }).join('');
    return '<span class="vp-label">web research</span><div class="vp-crawl"><div class="cr-head">' + GLOBE +
      '<span>crawling sources…</span></div>' + rows + '<div class="cr-tally">' + esc(tally || '') + '</div></div>';
  }
  function previewDoc(title, blocks) {
    var body = (blocks || []).map(function (b) {
      if (b.h) return '<div class="doc-h">' + esc(b.h) + '</div>';
      if (b.ul) return '<ul class="doc-ul">' + b.ul.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      if (b.chk) return '<ul class="doc-chk">' + b.chk.map(function (x) { return '<li class="' + (x[0] ? 'on' : 'off') + '">' + esc(x[1]) + '</li>'; }).join('') + '</ul>';
      return '<p class="doc-p">' + boldify(esc(b.p)) + '</p>';
    }).join('');
    return '<span class="vp-label">' + esc(title) + ' · preview</span><div class="vp-doc"><div class="doc-title">' +
      esc(title.replace('.md', '')) + '</div>' + body + '</div>';
  }
  function previewHushi(v) {
    var merged = v === 'v2';
    return '<span class="vp-label">localhost · playground</span><div class="vp-stage">' +
      '<div class="hushi-fab' + (merged ? ' merged' : '') + '">' +
      '<div class="hushi-orb">' + STAR + '</div></div>' +
      '<div class="hushi-card"><div class="hc-top"><span class="hc-mini">' + STAR.replace('class="star"', 'viewBox="0 0 24 24"') + '</span><span class="hc-name">Ask Hueshi</span><span class="hc-beta">BETA</span><span class="hc-role">copilot</span></div>' +
      '<div class="hc-msg">Your restock pattern is <b style="color:#fff">2.3 days</b> faster than peers. <span class="cite">Based on · Back-in-Stock report</span></div>' +
      '<div class="hc-bar">Ask about your demand…<span class="send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div></div>' +
      (merged ? '<span class="fab-hint">hover → splits into Hueshi + Intercom</span>' : '') +
      '</div>';
  }
  function previewHandoff() {
    return '<span class="vp-label">design handoff</span><div class="vp-handoff">' +
      '<div class="hd-title">Hueshi — Design Handoff</div>' +
      '<div class="hd-row"><span class="hd-sw" style="background:linear-gradient(135deg,#EE442E,#F26E5D)"></span>--hushi · #EE442E → #F26E5D</div>' +
      '<div class="hd-row"><span class="hd-sw" style="background:rgba(255,255,255,.1)"></span>radius 100px · glass blur 8px · Polaris</div>' +
      '<div class="hd-sec">states</div><div class="hd-states"><span>default</span><span>hover</span><span>open</span><span>streaming</span><span>error</span></div>' +
      '<div class="hd-deliver">' + CHECK + '<span>delivered → restockify-frontend</span></div></div>';
  }

  /* ============================================================
     Engine
     ============================================================ */
  var WT = {
    gen: 0, timers: [], si: -1, bi: -1, stationDone: false, finished: false,

    els: {
      steps: $('wtSteps'), tree: $('vsTree'), tabs: $('vsTabs'), crumbs: $('vsCrumbs'),
      gutter: $('vsGutter'), code: $('vsCode'), preview: $('vsPreview'), view: $('vsView'),
      main: $('vsMain'), term: $('vsTermBody'), agent: $('vsAgent'), agentBody: $('vsAgentBody'),
      agentState: $('vsAgentState'), prog: $('wtCur'), statusTask: $('vsStatusTask'), statusLang: $('vsStatusLang')
    },

    /* ---- one-time DOM: stepper + tree ---- */
    build: function () {
      var s = '';
      STEPS.forEach(function (st, i) {
        var notes = (st.notes || []).map(function (n) { return '<li>' + n + '</li>'; }).join('');
        s += '<li class="wt-step accent-' + st.ac + '" data-i="' + i + '"><span class="wt-dot"><span class="wt-num">' + (i + 1) + '</span>' + CHECK + '</span>' +
          '<span class="wt-txt"><span class="wt-st-name">' + st.name + '</span>' +
          '<span class="wt-st-sub">' + st.sub + '</span>' +
          '<ul class="wt-notes">' + notes + '</ul></span></li>';
      });
      this.els.steps.innerHTML = s;

      var tr = '';
      TREE.forEach(function (n) {
        var tw = (n.t === 'diro') ? '▾' : (n.t === 'dir') ? '▸' : '';
        tr += '<div class="vs-row ' + (n.t === 'diro' || n.t === 'dir' ? 'dir' : '') + (n.hidden ? ' hidden' : '') + '" data-id="' + n.id + '" data-depth="' + n.d + '">' +
          '<span class="tw">' + tw + '</span>' + fileIcon(n.t) + '<span class="nm">' + n.name + '</span>' +
          (n.tail ? '' : '<span class="badge-new">NEW</span>') + '</div>';
      });
      this.els.tree.innerHTML = tr;
    },

    clearTimers: function () { this.timers.forEach(clearTimeout); this.timers = []; },
    at: function (fn, ms) { var g = this.gen, self = this; this.timers.push(setTimeout(function () { if (g === self.gen) fn(); }, ms)); },

    /* ---- reset to the very start ---- */
    reset: function () {
      this.gen++; this.clearTimers(); this.si = -1; this.bi = -1; this.stationDone = false; this.finished = false;
      SLIDE.removeAttribute('data-done'); SLIDE.setAttribute('data-fill', '0');
      this.setFillPx(0);
      if (this.els.prog) this.els.prog.textContent = '1';
      [].forEach.call(this.els.steps.querySelectorAll('.wt-step'), function (e) { e.classList.remove('active', 'done'); });
      [].forEach.call(this.els.tree.querySelectorAll('.vs-row'), function (e) {
        e.classList.remove('active', 'appear', 'flash');
        if (TREE.some(function (n) { return n.id === e.dataset.id && n.hidden; })) e.classList.add('hidden');
      });
      this.els.main.classList.remove('term');
      this.els.view.classList.remove('split');
      this.els.preview.innerHTML = '';
      this.els.code.innerHTML = ''; this.els.gutter.innerHTML = ''; this.els.term.innerHTML = '';
      this.els.agentBody.innerHTML = ''; this.els.tabs.innerHTML = ''; this.els.crumbs.innerHTML = '';
    },

    accentVar: function (ac) { return 'var(--' + (ac === 'coral' ? 'coral' : ac === 'mint' ? 'mint' : 'blue-elec') + ')'; },

    /* ---- chrome for one beat (tabs, crumb, status, preview, term toggle) ---- */
    setChrome: function (beat) {
      var E = this.els;
      E.statusTask.textContent = beat.status || '';
      E.statusLang.textContent = beat.lang || '';
      E.tabs.innerHTML = (beat.tabs || []).map(function (t) {
        return '<div class="vs-tab ' + (t.on ? 'active' : '') + '">' + fileIcon(t.t) + '<span>' + t.n + '</span><span class="dot"></span></div>';
      }).join('');
      E.crumbs.innerHTML = (beat.crumb || []).map(function (c, k) {
        return (k ? '<span class="sepc">›</span>' : '') + '<span>' + c + '</span>';
      }).join(' ');
      E.main.classList.toggle('term', !!beat.term);
      var hasPrev = !!beat.preview;
      E.view.classList.toggle('split', hasPrev);
      if (hasPrev) { E.preview.className = 'vs-preview pv-' + beat.preview.type; E.preview.innerHTML = renderPreview(beat.preview); void E.preview.offsetWidth; E.preview.classList.add('pv-in'); }
      else { E.preview.className = 'vs-preview'; E.preview.innerHTML = ''; }
    },

    buildEditor: function (lang, code) {
      var E = this.els, lines = hl(lang, code);
      E.gutter.innerHTML = lines.map(function (_, k) { return '<span>' + (k + 1) + '</span>'; }).join('');
      E.code.innerHTML = '';
      var lineEls = lines.map(function (h) { var d = node('<span class="vs-line">' + (h || ' ') + '</span>'); E.code.appendChild(d); return d; });
      return { lines: lineEls, caret: node('<span class="caret"></span>') };
    },

    buildTerm: function (term) {
      var E = this.els; E.term.innerHTML = '';
      return (term || []).map(function (t) {
        var html = t.p != null ? '<span class="p">➜ ' + esc(t.p) + '</span> <span class="c">' + esc(t.c) + '</span>'
          : '<span class="' + (t.cls || 'o') + '">' + esc(t.o) + '</span>';
        var d = node('<span class="tl">' + html + '</span>'); E.term.appendChild(d); return d;
      });
    },

    // append this beat's transcript lines (they accumulate across beats)
    appendAgent: function (beat) {
      var E = this.els, els = [];
      if (beat.ask) { var a = node(askHTML(beat.ask)); a.classList.add('ag-line'); E.agentBody.appendChild(a); els.push(a); }
      (beat.agent || []).forEach(function (it) { var d = node(agentItemHTML(it)); d.classList.add('ag-line'); E.agentBody.appendChild(d); els.push(d); });
      return els;
    },
    scrollAgent: function () { this.els.agentBody.scrollTop = this.els.agentBody.scrollHeight; },

    applyTree: function (beat) {
      var E = this.els;
      [].forEach.call(E.tree.querySelectorAll('.vs-row'), function (e) { e.classList.remove('active'); });
      (beat.show || []).forEach(function (id) {
        var row = E.tree.querySelector('.vs-row[data-id="' + id + '"]');
        if (row && row.classList.contains('hidden')) { row.classList.remove('hidden'); void row.offsetWidth; row.classList.add('appear', 'flash'); }
      });
      var act = E.tree.querySelector('.vs-row[data-id="' + beat.active + '"]');
      if (act) { act.classList.remove('hidden'); act.classList.add('active'); }
    },

    /* ---- start a station: fresh Claude session, then play its beats ---- */
    playStation: function (i) {
      var E = this.els, st = STEPS[i];
      this.si = i; this.bi = -1; this.stationDone = false;
      SLIDE.setAttribute('data-fill', '1');
      [].forEach.call(E.steps.querySelectorAll('.wt-step'), function (e) {
        var k = +e.dataset.i; e.classList.toggle('done', k < i); e.classList.toggle('active', k === i);
      });
      this.setFill();
      E.agent.style.setProperty('--ac', this.accentVar(st.ac));
      E.agentBody.innerHTML = '';
      E.agent.setAttribute('data-state', 'run'); E.agentState.textContent = 'running';
      E.code.innerHTML = ''; E.gutter.innerHTML = ''; E.term.innerHTML = '';
      E.tabs.innerHTML = ''; E.crumbs.innerHTML = '';
      E.preview.innerHTML = ''; E.view.classList.remove('split'); E.main.classList.remove('term');
      this.playBeat(0);
    },

    /* ---- play one beat, slowly, then chain to the next (or finish station) ---- */
    playBeat: function (k) {
      var self = this, st = STEPS[this.si], beat = st.beats[k]; this.bi = k;
      var CODE_MS = 90, AG_MS = 540, TERM_MS = 380, PAUSE = 1000, STATION_HOLD = 2400;
      this.setChrome(beat);
      var ed = this.buildEditor(beat.editorLang, beat.code), lineEls = ed.lines, caret = ed.caret;
      var termEls = this.buildTerm(beat.term);
      var agEls = this.appendAgent(beat);
      this.at(function () { self.applyTree(beat); }, 240);
      var t = 300;
      agEls.forEach(function (el) { self.at(function () { el.classList.add('in'); var bars = el.querySelectorAll('.bar'); [].forEach.call(bars, function (b) { b.style.height = b.dataset.h + '%'; }); self.scrollAgent(); }, t); t += AG_MS; });
      var agEnd = t;
      var ct = 380;
      lineEls.forEach(function (el) { self.at(function () { el.classList.add('in'); el.appendChild(caret); }, ct); ct += CODE_MS; });
      var codeEnd = ct;
      var tt = Math.max(codeEnd, agEnd) - 260;
      termEls.forEach(function (el) { self.at(function () { el.classList.add('in'); }, tt); tt += TERM_MS; });
      var end = Math.max(agEnd, codeEnd, tt);
      if (k + 1 < st.beats.length) {
        this.at(function () { self.playBeat(k + 1); }, end + PAUSE);
      } else {
        this.at(function () { self.els.agent.setAttribute('data-state', 'done'); self.els.agentState.textContent = 'done'; self.stationDone = true; }, end - 40);
        // station finished — hold on the completed state, then LOOP this station's
        // animation in place. Moving to the next station happens only on a manual pass.
        this.at(function () { self.playStation(self.si); }, end + STATION_HOLD);
      }
    },

    /* ---- snap a station to its final composite state (skip / QA) ---- */
    renderStationFinal: function (i, upto) {
      var E = this.els, st = STEPS[i];
      var top = (upto == null) ? st.beats.length - 1 : Math.max(0, Math.min(st.beats.length - 1, upto));
      var shown = st.beats.slice(0, top + 1);
      this.si = i; this.bi = top; this.stationDone = true;
      [].forEach.call(E.steps.querySelectorAll('.wt-step'), function (e) {
        var k = +e.dataset.i; e.classList.toggle('done', k < i); e.classList.toggle('active', k === i);
      });
      this.setFill();
      E.agent.style.setProperty('--ac', this.accentVar(st.ac));
      // transcript up to this beat, revealed
      E.agentBody.innerHTML = '';
      shown.forEach(function (beat) {
        if (beat.ask) { var a = node(askHTML(beat.ask)); a.classList.add('ag-line', 'in'); E.agentBody.appendChild(a); }
        (beat.agent || []).forEach(function (it) {
          var d = node(agentItemHTML(it)); d.classList.add('ag-line', 'in');
          var bars = d.querySelectorAll('.bar'); [].forEach.call(bars, function (b) { b.style.height = b.dataset.h + '%'; });
          E.agentBody.appendChild(d);
        });
      });
      E.agent.setAttribute('data-state', 'done'); E.agentState.textContent = 'done';
      var last = st.beats[top];
      this.setChrome(last);
      var ed = this.buildEditor(last.editorLang, last.code);
      ed.lines.forEach(function (el) { el.classList.add('in'); });
      if (ed.lines.length) ed.lines[ed.lines.length - 1].appendChild(ed.caret);
      var tm = null; shown.forEach(function (b) { if (b.term) tm = b.term; });
      E.main.classList.toggle('term', !!tm);
      this.buildTerm(tm).forEach(function (el) { el.classList.add('in'); });
      // cumulative files across stations 0..i
      for (var s = 0; s <= i; s++) {
        STEPS[s].beats.forEach(function (b) {
          (b.show || []).forEach(function (id) { var row = E.tree.querySelector('.vs-row[data-id="' + id + '"]'); if (row) row.classList.remove('hidden'); });
        });
      }
      [].forEach.call(E.tree.querySelectorAll('.vs-row'), function (e) { e.classList.remove('active'); });
      var act = E.tree.querySelector('.vs-row[data-id="' + last.active + '"]');
      if (act) { act.classList.remove('hidden'); act.classList.add('active'); }
      this.scrollAgent();
    },

    fillStyle: function () {
      var el = document.getElementById('wt-fill-style');
      if (!el) { el = document.createElement('style'); el.id = 'wt-fill-style'; document.head.appendChild(el); }
      return el;
    },
    setFillPx: function (h) { this.fillStyle().textContent = '#wtSteps::after{height:' + h + 'px}'; },
    setFill: function () {
      var steps = this.els.steps, active = steps.querySelector('.wt-step.active'), first = steps.querySelector('.wt-step');
      if (!active || !first) return;
      this.setFillPx((active.offsetTop + 16) - (first.offsetTop + 16));
    },

    /* ---- manual pass: interrupt the current loop and move to the next
           station; on the last station, leave the slide via reveal.js ---- */
    advanceStation: function () {
      if (STATIC) { if (window.Reveal) Reveal.next(); return; }
      this.gen++; this.clearTimers();
      var next = this.si + 1;
      if (next >= STEPS.length) { if (window.Reveal) Reveal.next(); return; }  // last → leave slide
      this.playStation(next);
    },
    skip: function () { this.advanceStation(); },

    finish: function () {
      this.finished = true;
      this.gen++; this.clearTimers();
      [].forEach.call(this.els.steps.querySelectorAll('.wt-step'), function (e) { e.classList.remove('active'); e.classList.add('done'); });
      SLIDE.setAttribute('data-done', 'all');
      var steps = this.els.steps, first = steps.querySelector('.wt-step'), all = steps.querySelectorAll('.wt-step');
      var last = all[all.length - 1];
      this.setFillPx((last.offsetTop + 16) - (first.offsetTop + 16));
    },

    /* ---- entry points ---- */
    start: function () {
      this.reset();
      if (STATIC) { // qa / reduced motion → show finished state
        this.renderStationFinal(STEPS.length - 1);
        this.finish();
        return;
      }
      var self = this;
      this.at(function () { self.playStation(0); }, 300);
    }
  };

  WT.build();

  /* ============================================================
     Wiring: buttons, keys, reveal.js hooks
     ============================================================ */
  $('wtSkip') && $('wtSkip').addEventListener('click', function () { WT.skip(); });
  $('wtNext') && $('wtNext').addEventListener('click', function () { if (window.Reveal) Reveal.next(); });
  $('wtReplay') && $('wtReplay').addEventListener('click', function () { WT.start(); });

  function onSlide() { return window.Reveal && Reveal.getCurrentSlide && Reveal.getCurrentSlide() === SLIDE; }

  // Each station loops its own animation in place; the presenter passes it manually.
  // While on the slide we intercept forward navigation so → / space / PageDown / s
  // (and a click) advance to the NEXT station instead of leaving the slide. Only on
  // the last station does forward navigation leave the slide. 'r' replays from the top.
  document.addEventListener('keydown', function (e) {
    if (!onSlide() || STATIC) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === ' ' || k === 'Spacebar' || k === 'PageDown' || k === 's' || k === 'S') {
      e.preventDefault(); e.stopImmediatePropagation();
      WT.advanceStation();
    } else if (k === 'r' || k === 'R') {
      e.preventDefault(); e.stopImmediatePropagation();
      WT.start();
    }
  }, true);

  // Click anywhere on the slide advances to the next station too.
  SLIDE.addEventListener('click', function () { if (!STATIC) WT.advanceStation(); });

  function boot() {
    if (!window.Reveal) return;
    Reveal.on('slidechanged', function (ev) {
      if (ev.currentSlide === SLIDE) WT.start();
      else if (ev.previousSlide === SLIDE) { WT.gen++; WT.clearTimers(); }
    });
    // deep-link / reload directly onto the slide
    if (onSlide()) WT.start();

    // ?wstep=N (&wbeat=K) — freeze on a station's final (or a given beat's) state
    var wp = new URLSearchParams(location.search);
    if (wp.has('wstep')) {
      var n = Math.max(0, Math.min(STEPS.length - 1, parseInt(wp.get('wstep'), 10) || 0));
      var b = wp.has('wbeat') ? (parseInt(wp.get('wbeat'), 10) || 0) : null;
      WT.reset(); WT.renderStationFinal(n, b);
    }
  }

  if (window.Reveal && Reveal.isReady && Reveal.isReady()) boot();
  else if (window.Reveal) Reveal.on('ready', boot);
  else window.addEventListener('load', boot);
})();
