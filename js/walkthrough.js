/* ============================================================
   Live walkthrough — Tous builds the Nosto integration.
   A VS Code window steps through the Research stage of the Tous
   workflow, building a native Nosto integration for Notify Me.

   Redesign (2026-07-17): no left stepper. The workflow lives in a
   top-right corner tracker (.owf) — stage titles, the active stage
   expands to its stations and checks them off. The VS Code main area
   cross-fades through beats:
     0 hero      "Let's build the Nosto integration" + Nosto logo
     1 vscode    Explorer + full-width Claude panel
     2 prompt    the user types + sends -> the Tous workflow starts
     3 plan      the view splits; the workflow tracker shows stages+stations
     4 browser   Market Research: browse nosto.com + read our docs
     5 research  market-research.md, rendered (Market Research checked)
     6 prd       prd.md, rendered (PRD checked) -> Research stage done

   Manual-advance per beat: each beat plays once on entry then waits.
     click / -> / space / PageDown / s  advance to the next beat
     r                                  replay from the top
   After the last built beat, -> leaves the slide (reveal.js).
   ?qa / reduced-motion renders the finished state; ?wbeat=N freezes a beat.
   ============================================================ */
(function () {
  'use strict';

  var SLIDE = document.getElementById('walkthrough');
  if (!SLIDE) return;

  var STATIC = document.documentElement.classList.contains('qa') ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function boldify(s) { return s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }
  function node(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var CHECK_FILL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg>';
  var CL_LOGO = '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="20" y1="3.5" x2="20" y2="14"/><line x1="28.5" y1="5.8" x2="23" y2="14.8"/><line x1="34.2" y1="11.5" x2="25.2" y2="17"/><line x1="36.5" y1="20" x2="26" y2="20"/><line x1="34.2" y1="28.5" x2="25.2" y2="23"/><line x1="28.5" y1="34.2" x2="23" y2="25.2"/><line x1="20" y1="36.5" x2="20" y2="26"/><line x1="11.5" y1="34.2" x2="17" y2="25.2"/><line x1="5.8" y1="28.5" x2="14.8" y2="23"/><line x1="3.5" y1="20" x2="14" y2="20"/><line x1="5.8" y1="11.5" x2="14.8" y2="17"/><line x1="11.5" y1="5.8" x2="17" y2="14.8"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function fileIcon(t) {
    var col = { md: '#6AA6FF', py: '#5FD0A6', ts: '#6AA6FF', tsx: '#6AA6FF', json: '#E6C07B' }[t] || '#8B94A8';
    if (t === 'dir' || t === 'diro') {
      return '<span class="fi" style="color:#7d879b"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" opacity=".9"/></svg></span>';
    }
    return '<span class="fi" style="color:' + col + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg></span>';
  }

  /* ============================================================
     Explorer tree — the nosto-integration workspace
     ============================================================ */
  var TREE = [
    // Notify Me's repos are all added to the workspace (multi-root). Product repos stay collapsed;
    // the folders this build touches (nosto-integration, notify-me-docs) are expanded.
    { id: 'fe', d: 0, t: 'dir', name: 'nm-frontend' },
    { id: 'be', d: 0, t: 'dir', name: 'nm-backend' },
    { id: 'ext', d: 0, t: 'dir', name: 'nm-extensions' },
    { id: 'dplay', d: 0, t: 'dir', name: 'nm-design-playground' },
    { id: 'dawn', d: 0, t: 'dir', name: 'nm-dawn-playground' },
    { id: 'ni', d: 0, t: 'diro', name: 'nosto-integration' },
    { id: 'research', d: 1, t: 'diro', name: 'research' },
    { id: 'mr', d: 2, t: 'md', name: 'market-research.md', hidden: 1 },
    { id: 'prd', d: 2, t: 'md', name: 'prd.md', hidden: 1 },
    { id: 'dsg', d: 1, t: 'diro', name: 'design' },
    { id: 'handoff', d: 2, t: 'md', name: 'handoff.md', hidden: 1 },
    { id: 'eng', d: 1, t: 'diro', name: 'engineering' },
    { id: 'dod', d: 2, t: 'md', name: 'dod.md', hidden: 1 },
    { id: 'plan', d: 2, t: 'md', name: 'plan.md', hidden: 1 },
    { id: 'dlv', d: 1, t: 'diro', name: 'delivery' },
    { id: 'changelog', d: 2, t: 'md', name: 'CHANGELOG.md', hidden: 1 },
    { id: 'learn', d: 2, t: 'md', name: 'learnings.md', hidden: 1 },
    { id: 'readme', d: 1, t: 'md', name: 'README.md', tail: 1 },
    { id: 'docs', d: 0, t: 'diro', name: 'notify-me-docs' },
    { id: 'signals', d: 1, t: 'md', name: 'demand-signals.md', tail: 1 },
    { id: 'nostoapi', d: 1, t: 'md', name: 'nosto-api.md', tail: 1 },
    { id: 'dclaude', d: 0, t: 'dir', name: '.claude', tail: 'skills · agents · hooks' },
    { id: 'claudemd', d: 0, t: 'md', name: 'CLAUDE.md', tail: 1 }
  ];

  /* ============================================================
     Stages + stations — the tracker (from the Tous slide).
     Only Research is built now; the rest are titles for the plan.
     ============================================================ */
  var STAGES = [
    { key: 'research', name: 'Research', ac: 'blue',
      stations: [{ key: 'market', name: 'Market Research' }, { key: 'prd', name: 'PRD' }] },
    { key: 'design', name: 'Design', ac: 'coral',
      stations: [{ key: 'uiux', name: 'UI/UX Design' }, { key: 'review', name: 'Design Review' }, { key: 'handoff', name: 'Design Handoff' }] },
    { key: 'engineering', name: 'Engineering', ac: 'blue',
      stations: [{ key: 'dod', name: 'Definition of Done' }, { key: 'dodrev', name: 'DoD Review' }, { key: 'planning', name: 'Planning' }, { key: 'planrev', name: 'Plan Review' }] },
    { key: 'production', name: 'Production', ac: 'blue',
      stations: [{ key: 'coding', name: 'Coding' }, { key: 'codereview', name: 'Code Review' }] },
    { key: 'testing', name: 'Testing', ac: 'mint',
      stations: [{ key: 'techqa', name: 'Technical QA' }, { key: 'productqa', name: 'Product QA' }, { key: 'visualqa', name: 'Visual QA' }] },
    { key: 'delivery', name: 'Delivery & Learning', ac: 'mint',
      stations: [{ key: 'release', name: 'Release' }, { key: 'announce', name: 'Release Announcement' }, { key: 'documentation', name: 'Documentation' }, { key: 'learning', name: 'Learning' }] }
  ];

  /* ============================================================
     Claude-Code transcript item builders
     ============================================================ */
  function L(b, x) { return { b: b, x: x }; }                         // reasoning line
  function T(fn, arg, out) { return { tool: 1, fn: fn, arg: arg, out: out }; }  // tool call
  function H(x) { return { hook: 1, x: x }; }                          // hook note
  function R(f, note, tone) { return { report: 1, f: f, note: note, tone: tone || '' }; }

  /* ============================================================
     Rendered-doc content (compiled markdown views)
     ============================================================ */
  var DOC_MR = {
    file: 'market-research.md', ac: 'blue',
    title: 'Market Research',
    lead: 'Where Notify Me demand signals meet <b>Nosto personalization.</b>',
    blocks: [
      { sec: 'The signal' },
      { p: 'Merchants run Notify Me for demand capture and Nosto for personalization, but the two never talk. The strongest first-party signal a store owns, what a shopper is waiting for, never reaches the layer that decides what they see.' },
      { p: 'Every back-in-stock subscription, wishlist add, and pre-order is an explicit statement of intent. Today that intent expires inside Notify Me instead of shaping the storefront.' },
      { sec: 'Market' },
      { ul: [
        'Nosto is a leading Shopify personalization and CDP platform, deployed across thousands of SI-built stores.',
        '"Ask-your-data" segmentation on real behavior is now a baseline merchant expectation.',
        '<b>Back-in-stock, wishlist and pre-order</b> intent are the highest-signal events a store has.',
        'Today they sit inside Notify Me, invisible to Nosto segments, triggers and campaigns.'
      ] },
      { sec: 'Competitive landscape' },
      { ul: [
        'Klaviyo and Omnisend consume back-in-stock events, but only for email, not on-site personalization.',
        'Generic Zapier bridges exist, but they are brittle, unscoped, and drop consent.',
        'No competitor writes demand intent into Nosto profiles natively. That is the gap.'
      ] },
      { sec: 'Opportunity' },
      { ul: [
        'Stream Notify Me demand events into Nosto as <b>segments and events</b>.',
        'Power restock campaigns, out-of-stock recovery, and demand-ranked recommendations.',
        'Cross-shop history (30k+ shops) becomes peer benchmarks Nosto alone cannot see.'
      ] },
      { sec: 'Risks' },
      { ul: [
        'Consent and data residency: only sync opted-in shoppers, scoped per shop.',
        'Token handling: Nosto issues long-lived tokens; store and rotate them safely.',
        'Sync starts from connect; there is no historical backfill in v1. Set expectations in the UI.'
      ] },
      { note: { lbl: 'Recommendation', text: 'Build a native Nosto integration: OAuth-style token connect, a consented demand-event stream, and synced audience segments. Ship a read-and-write v1; defer two-way segment sync to phase 2.' } }
    ]
  };
  var DOC_PRD = {
    file: 'prd.md', ac: 'blue',
    title: 'Product Requirements',
    lead: 'Bridge Notify Me demand data into Nosto, <b>natively.</b>',
    blocks: [
      { sec: 'Problem' },
      { p: 'Demand signals live in Notify Me; personalization lives in Nosto. Merchants rebuild the bridge by hand with brittle automations, or go without and personalize blind to what shoppers are actually waiting for.' },
      { sec: 'Users & jobs' },
      { ul: [
        'Merchant admin (all plans): connect Nosto once, then segment and personalize on demand.',
        'SI partner: configure the connection at store setup, with clear scope and consent.',
        'Shopper: sees more relevant restock nudges and recommendations, never spam.'
      ] },
      { sec: 'Capabilities · v1' },
      { chk: [
        [1, 'Connect a Nosto account with an API token, validated inline'],
        [1, 'Stream back-in-stock / wishlist / pre-order events to Nosto profiles'],
        [1, 'Sync demand segments as Nosto audiences, keyed by shopper email'],
        [1, 'Campaign recipes: restock, out-of-stock recovery, demand-ranked recs'],
        [1, 'Respect consent; skip opted-out shoppers'],
        [0, 'Two-way sync of Nosto segments back into Notify Me (phase 2)']
      ] },
      { sec: 'Non-goals' },
      { ul: [
        'No historical backfill in v1; sync begins at connect.',
        'No PII beyond email and the demand flags listed in the data map.',
        'No storefront rendering; Nosto owns the on-site experience.'
      ] },
      { sec: 'Success metrics' },
      { ul: [
        'Connect completion rate for merchants who start setup.',
        'Share of demand events delivered to Nosto within SLA.',
        'Merchant-reported lift on restock and recovery campaigns.'
      ] },
      { note: { lbl: 'Rollout', text: 'Shopify App Store listing · opt-in connect · gradual rollout behind <code>nosto_sync</code>, starting at 10% of shops.' } }
    ]
  };
  var DOC_HANDOFF = {
    file: 'handoff.md', ac: 'coral',
    title: 'Design Handoff',
    lead: 'The Nosto integration UI, ready for <b>engineering.</b>',
    blocks: [
      { sec: 'Screen' },
      { shot: 'v2', cap: 'Settings › Integrations › Connect to Nosto' },
      { sec: 'Anatomy' },
      { ul: [
        'Integrations list gains a <b>Nosto</b> card (pink mark, Beta) with a Connect action.',
        'Detail page: an API-token field with inline validation, then a primary Connect.',
        'A "Data sent to Nosto" card lists every attribute, grouped by Identity and Intent.'
      ] },
      { sec: 'Tokens & states' },
      { ul: [
        'Primary action uses the Notify Me button style, disabled until the token validates.',
        'States: empty · validating · valid · connecting · connected · error.',
        'Valid token shows a masked value and a green check; errors surface inline, not as a toast.'
      ] },
      { sec: 'Interaction' },
      { ul: [
        'Validation runs on paste and on blur; the button enables only on success.',
        'Connecting shows a spinner in the button; success swaps the card to a Connected state.',
        'Disconnect is a low-emphasis destructive action behind a confirm.'
      ] },
      { sec: 'Accessibility' },
      { ul: [
        'Every field has a visible label; banners use role="status" / role="alert".',
        'Focus order: token field, Connect, then the data card. Contrast meets AA.'
      ] },
      { note: { lbl: 'Delivered to', text: 'nm-frontend · Settings module. Polaris components matched to the app shell, tokens in the design system.' } }
    ]
  };
  var DOC_DOD = {
    file: 'dod.md', ac: 'blue',
    title: 'Technical Definition of Done',
    lead: 'What "done" means for the <b>Nosto sync.</b>',
    blocks: [
      { sec: 'Done when' },
      { chk: [
        [1, 'Token connect + validation against the Nosto API'],
        [1, 'Demand events (BIS / wishlist / pre-order) stream to Nosto profiles'],
        [1, 'Attributes written idempotently, keyed by shopper email'],
        [1, 'Consent respected; nothing sent for opted-out shoppers'],
        [1, 'Zero cross-shop leakage; shop_id scoped server-side']
      ] },
      { sec: 'Reliability' },
      { chk: [
        [1, 'Retries with backoff; a dead-letter queue after repeated failure'],
        [1, 'Per-shop rate limits honor the Nosto API budget'],
        [1, 'Sync is resumable; a restart never double-writes']
      ] },
      { sec: 'Observability' },
      { ul: [
        'Structured logs per event: shop, type, result, latency.',
        'A dashboard tile for delivery rate and queue depth, alerting on backlog.'
      ] },
      { sec: 'Security' },
      { ul: [
        'Tokens encrypted at rest, never logged, rotatable without downtime.',
        'Every write carries a shop scope; a missing scope fails closed.'
      ] },
      { note: { lbl: 'Guardrail', text: 'Grounded-or-skip: a profile write only ever fires on a real, consented demand event. No inferred writes.' } }
    ]
  };
  var DOC_PLAN = {
    file: 'plan.md', ac: 'blue',
    title: 'Technical Plan',
    lead: 'Two planes, <b>one seam.</b>',
    blocks: [
      { sec: 'Shape' },
      { ul: [
        '<b>nm-backend</b>: a Nosto client + an event mapper (demand event to profile attributes).',
        '<b>nm-frontend</b>: the Connect settings page + inline token validation.',
        'A durable queue drains demand events to Nosto, retried with backoff.'
      ] },
      { sec: 'Data flow' },
      { p: 'A demand event fires in Notify Me, is enqueued with its shop scope, mapped to nm_* attributes, and written to the matching Nosto profile by email. Consent is checked at enqueue and again at write.' },
      { sec: 'Contract' },
      { p: 'profile-write { email, attributes{}, source: "notify-me", shop_id }, behind the <code>nosto_sync</code> flag. Writes are idempotent on (shop_id, email, attribute).' },
      { sec: 'Failure modes' },
      { ul: [
        'Nosto 5xx or timeout: retry with backoff, then dead-letter after N attempts.',
        'Invalid or revoked token: pause the shop, surface a reconnect prompt in Settings.',
        'Rate limit: shed load per shop, never globally.'
      ] },
      { sec: 'Rollout' },
      { p: 'Ship behind nosto_sync at 10% of shops, watch delivery rate and queue depth, then ramp. Backwards-compatible; disabling the flag stops writes cleanly.' },
      { note: { lbl: 'Review', text: 'Plan reviewed: idempotent writes, per-shop rate limits, dead-letter on repeated failure, clean flag-off path.' } }
    ]
  };
  var DOC_ANNOUNCE = {
    file: 'CHANGELOG.md', ac: 'mint',
    title: 'Nosto integration (Beta)',
    lead: 'Turn Notify Me demand into <b>Nosto personalization.</b>',
    blocks: [
      { sec: 'New' },
      { ul: [
        'Connect Nosto from Settings › Integrations with an API token.',
        'Back-in-stock, wishlist and pre-order intent sync to Nosto profiles.',
        'Segment and personalize on real demand, keyed by shopper email.'
      ] },
      { sec: 'How it works' },
      { p: 'Once connected, new demand activity streams to each shopper\'s Nosto customer profile as attributes you can segment and trigger on. Nothing is sent for shoppers who have not opted in.' },
      { sec: 'What you can build' },
      { ul: [
        'A "waiting to buy" segment for restock campaigns.',
        'Out-of-stock recovery flows that fire the moment stock returns.',
        'Demand-ranked recommendations on the storefront.'
      ] },
      { sec: 'Who it is for' },
      { ul: [
        'Merchants running both Notify Me and Nosto.',
        'SI partners configuring personalization at setup.'
      ] },
      { note: { lbl: 'Rollout', text: 'Available on all plans · opt-in · gradual rollout behind nosto_sync. Sync starts at connect; no historical backfill.' } }
    ]
  };
  var DOC_DOCS = {
    file: 'nosto-integration.md', ac: 'mint',
    title: 'Nosto Integration · Docs',
    lead: 'Set up the Nosto integration in <b>three steps.</b>',
    blocks: [
      { sec: 'Setup' },
      { ul: [
        'In Nosto, request an API token with customer-data access.',
        'In Notify Me, open Settings › Integrations › Nosto and paste the token.',
        'Connect. New demand activity starts syncing to Nosto profiles.'
      ] },
      { sec: 'Attributes written' },
      { ul: [
        '<code>nm_email</code> — the key Nosto matches on.',
        '<code>nm_bis_active</code> — waitlisting a back-in-stock item.',
        '<code>nm_wishlist_active</code> — has an active wishlist.',
        '<code>nm_preorder_customer</code> — placed a pre-order.',
        '<code>nm_notified_not_purchased</code> — notified of a restock, not yet bought.'
      ] },
      { sec: 'Segments & campaigns' },
      { p: 'Build a Nosto segment on any nm_* attribute, then attach it to a pop-up, email trigger, or recommendation. Restock recovery is the highest-converting starting point.' },
      { sec: 'Troubleshooting' },
      { ul: [
        'No data flowing? Confirm the token is valid and the flag is on for your shop.',
        'Missing a shopper? They may not have opted in, or have no demand event yet.',
        'Token revoked in Nosto? Reconnect from Settings to resume.'
      ] },
      { note: { lbl: 'Note', text: 'Sync starts from connect; historical demand is not backfilled in this release.' } }
    ]
  };
  var DOC_LEARN = {
    file: 'learnings.md', ac: 'mint',
    title: 'Learnings',
    lead: 'What the factory <b>keeps.</b>',
    blocks: [
      { sec: 'Kept' },
      { ul: [
        'A reusable Shopify-app token-connect + validation pattern.',
        'The demand-event to profile-attribute mapper, ready for the next CDP.',
        'A settings-integration card + detail-page template.',
        'A consented, shop-scoped event stream with retries and a dead-letter queue.'
      ] },
      { sec: 'What worked' },
      { ul: [
        'Grounded-or-skip kept the sync honest: no inferred writes, ever.',
        'Shipping v1 read-and-write and deferring two-way sync kept scope tight.'
      ] },
      { sec: 'What to improve' },
      { ul: [
        'Add historical backfill behind a one-time, rate-limited job.',
        'Surface delivery health to merchants, not just internal dashboards.'
      ] },
      { sec: 'Next' },
      { p: 'The same connect flow and mapper generalize to any CDP. The next integration starts from this template, not from zero.' },
      { note: { lbl: 'Compounds', text: 'Each integration makes the next one cheaper. The factory keeps the pattern, not just the feature. The loop closes.' } }
    ]
  };
  var DOCS = { mr: DOC_MR, prd: DOC_PRD, handoff: DOC_HANDOFF, dod: DOC_DOD, plan: DOC_PLAN, announce: DOC_ANNOUNCE, docs: DOC_DOCS, learn: DOC_LEARN };

  function docHTML(doc) {
    var body = (doc.blocks || []).map(function (b) {
      if (b.sec) return '<div class="doc-sec"><span class="bar"></span><span class="t">' + esc(b.sec) + '</span></div>';
      if (b.p) return '<p class="doc-p">' + unesc(b.p) + '</p>';
      if (b.ul) return '<ul class="doc-ul">' + b.ul.map(function (x) { return '<li>' + unesc(x) + '</li>'; }).join('') + '</ul>';
      if (b.chk) return '<ul class="doc-chk">' + b.chk.map(function (x) { return '<li class="' + (x[0] ? 'on' : 'off') + '">' + esc(x[1]) + '</li>'; }).join('') + '</ul>';
      if (b.note) return '<div class="doc-note"><span class="lbl">' + esc(b.note.lbl) + '</span>' + unesc(b.note.text) + '</div>';
      if (b.shot) return '<div class="doc-shot"><div class="doc-shot-frame">' + designThumb(b.shot) + '</div>' + (b.cap ? '<span class="doc-cap">' + esc(b.cap) + '</span>' : '') + '</div>';
      return '';
    }).join('');
    return '<div class="doc" style="--ac:var(--' + (doc.ac === 'coral' ? 'coral' : doc.ac === 'mint' ? 'mint' : 'blue-elec') + ')">' +
      '<div class="doc-scroll"><div class="doc-page">' +
      '<span class="doc-file">' + fileIcon('md') + esc(doc.file) + '&nbsp;·&nbsp;<span class="pill-preview">preview</span></span>' +
      '<div class="doc-h1">' + unesc(doc.title) + '</div>' +
      '<p class="doc-lead">' + unesc(doc.lead) + '</p>' +
      body + '</div></div></div>';
  }
  // allow a small, trusted set of inline tags (<b>, <code>) inside doc copy
  function unesc(s) {
    return esc(s).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')
      .replace(/&lt;code&gt;/g, '<code>').replace(/&lt;\/code&gt;/g, '</code>');
  }

  /* ============================================================
     Browser view (nosto.com + our docs)
     ============================================================ */
  function browserHTML() {
    return '<div class="bz">' +
      '<div class="bz-tabs">' +
        '<div class="bz-tab on"><span class="fav" style="color:#FF66BF">' + GLOBE + '</span><span class="nm">Nosto · Commerce Experience Platform</span></div>' +
        '<div class="bz-tab"><span class="fav" style="color:#4C87FF">' + GLOBE + '</span><span class="nm">Notify Me · Integration docs</span></div>' +
      '</div>' +
      '<div class="bz-nav"><span class="btns">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>' +
      '</span><span class="bz-url"><span class="lock">' + LOCK + '</span>nosto.com/platform/personalization</span></div>' +
      '<div class="bz-page"><div class="nz">' +
        '<div class="nz-top"><img class="logo" src="img/Nosto - Primary Logo.svg" alt="Nosto">' +
          '<span class="nav"><span>Platform</span><span>Solutions</span><span>Pricing</span></span>' +
          '<span class="cta">Book a demo</span></div>' +
        '<div class="nz-hero">' +
          '<div class="nz-kick">Commerce Experience Platform</div>' +
          '<div class="nz-h">Personalization for every shopper.</div>' +
          '<div class="nz-p">Segment, recommend and merchandise in real time across the storefront, from one platform.</div>' +
          '<div class="nz-chips">' +
            '<span class="nz-chip">Personalization</span>' +
            '<span class="nz-chip read">Segmentation</span>' +
            '<span class="nz-chip">Recommendations</span>' +
            '<span class="nz-chip read">Audiences &amp; events</span>' +
            '<span class="nz-chip">Merchandising</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="bz-read"><span class="sp"></span><span>Reading <b>nosto.com/platform</b> · mapping segments &amp; events to Notify Me demand signals</span><span class="tally">12 sources</span></div>' +
      '</div></div>';
  }

  /* the workflow-plan placeholder (beat 3) shown left of the tracker */
  function planHTML() {
    return '<div class="vw vw-plan">' +
      '<div class="pl-eyebrow">Tous · run started</div>' +
      '<div class="pl-h">Stage 01&nbsp;·&nbsp;<b>Research.</b></div>' +
      '<div class="pl-sub">The orchestrator mapped the request to six stages and eighteen stations. Dispatching the researcher agent to the first station.</div>' +
      '<div class="pl-disp"><span class="sp"></span>researcher agent · working</div>' +
    '</div>';
  }

  /* ============================================================
     Design preview — a live view of the designed Notify Me UI
     (the "Connect to Nosto" integration page), medium fidelity.
     v1 = first pass · v2 = after the design review's fix.
     ============================================================ */
  var INFO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01" stroke-linecap="round"/></svg>';
  var WARN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 22 20H2z"/><path d="M12 10v4M12 17v.01"/></svg>';
  var NOSTO_MARK = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 6h20a8 8 0 0 1 8 8v20L20 20 6 6z" fill="#FF66BF"/></svg>';

  function designPreviewHTML() {
    return '<div class="dp">' +
      '<div class="dp-bar"><span class="dp-dots"><i></i><i></i><i></i></span>' +
        '<span class="dp-url">localhost:3000  ·  Settings › Integrations › Nosto</span>' +
        '<span class="dp-tag">preview</span></div>' +
      '<div class="dp-page">' +
        '<div class="dp-back"><span class="dp-chev">‹</span><span class="dp-title">Connect to Nosto</span><span class="dp-beta">Beta</span></div>' +
        '<div class="dp-card">' +
          '<div class="dp-h">Connect with an API token</div>' +
          '<div class="dp-desc">Enter a Nosto API token with customer-data access. Nosto issues this token; request it from your Nosto account manager.</div>' +
          '<div class="dp-label">Nosto API token</div>' +
          '<div class="dp-input ok"><span class="dp-tok">nosto_sk_live_••••••••4f2a</span><span class="dp-valid">' + CHECK + 'Valid token</span></div>' +
          '<div class="dp-foot"><button class="dp-btn primary">Connect to Nosto</button></div>' +
        '</div>' +
        '<div class="dp-card soft">' +
          '<div class="dp-h row"><span>Data sent to Nosto</span><span class="dp-link">Learn more</span></div>' +
          '<div class="dp-grp">Identity</div>' +
          '<div class="dp-attr"><b>nm_email</b><span>Shopper email, the key Nosto matches on.</span></div>' +
          '<div class="dp-grp">Intent flags</div>' +
          '<div class="dp-attr"><b>nm_bis_active</b><span>Actively waitlisting a back-in-stock item.</span></div>' +
          '<div class="dp-attr"><b>nm_wishlist_active</b><span>Has an active wishlist.</span></div>' +
          '<div class="dp-attr"><b>nm_preorder_customer</b><span>Placed a pre-order.</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  // a small static thumbnail of the design, embedded in the handoff doc as a "screenshot"
  function designThumb() {
    return '<div class="dpt">' +
      '<div class="dpt-bar"><span class="dpt-dots"><i></i><i></i><i></i></span><span class="dpt-t">Connect to Nosto</span></div>' +
      '<div class="dpt-body">' +
        '<div class="dpt-back">‹ <b>Connect to Nosto</b> <span class="dpt-beta">Beta</span></div>' +
        '<div class="dpt-card">' +
          '<div class="dpt-line w60"></div><div class="dpt-line w90 sm"></div>' +
          '<div class="dpt-field"><span class="dpt-tok">nosto_sk_live_••••4f2a</span><span class="dpt-ck">' + CHECK + '</span></div>' +
          '<div class="dpt-line w90"></div><div class="dpt-line w60 sm"></div>' +
          '<div class="dpt-foot"><span class="dpt-btn"></span></div>' +
        '</div>' +
      '</div></div>';
  }

  /* ============================================================
     Code editor view (Production) — a compact syntax highlighter
     ============================================================ */
  var CODE_RULES = {
    ts: [
      [/\/\/.*/y, 'com'],
      [/`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/y, 'str'],
      [/\b(?:const|let|var|function|return|import|export|from|type|interface|class|extends|new|await|async|if|else|for|of|in|while|public|private|readonly|as|default|null|undefined|true|false|this|void)\b/y, 'key'],
      [/\b\d[\d_.]*\b/y, 'num'],
      [/[A-Za-z_$][\w$]*(?=\s*\()/y, 'fn'],
      [/[A-Z][\w$]*/y, 'typ'],
      [/[{}()\[\].,:;=+\-*/%<>!&|?]+/y, 'punc'],
      [/[\w$]+/y, 'id']
    ],
    py: [
      [/#.*/y, 'com'],
      [/(?:f|r)?"(?:[^"\\]|\\.)*"|(?:f|r)?'(?:[^'\\]|\\.)*'/y, 'str'],
      [/\b(?:def|class|return|import|from|as|if|elif|else|for|while|in|not|and|or|None|True|False|with|try|except|raise|await|async|lambda|yield|pass|is|await)\b/y, 'key'],
      [/\b\d[\d_.]*\b/y, 'num'],
      [/[A-Za-z_][\w]*(?=\s*\()/y, 'fn'],
      [/[{}()\[\].,:;=+\-*/%<>!&|]+/y, 'punc'],
      [/\w+/y, 'id']
    ]
  };
  function hlLine(lang, line) {
    var rules = CODE_RULES[lang]; if (!rules) return esc(line);
    var out = '', i = 0, guard = 0;
    while (i < line.length && guard++ < 3000) {
      var matched = false;
      for (var r = 0; r < rules.length; r++) {
        var re = rules[r][0]; re.lastIndex = i; var m = re.exec(line);
        if (m && m.index === i && m[0].length) {
          var cls = rules[r][1];
          out += cls === 'id' ? esc(m[0]) : '<span class="ck-' + cls + '">' + esc(m[0]) + '</span>';
          i += m[0].length; matched = true; break;
        }
      }
      if (!matched) { out += esc(line[i]); i++; }
    }
    return out;
  }
  function codeHTML(spec) {
    var lines = spec.code.split('\n');
    var gutter = lines.map(function (_, k) { return '<span>' + (k + 1) + '</span>'; }).join('');
    var body = lines.map(function (l) { return '<span class="ck-line">' + (hlLine(spec.lang, l) || ' ') + '</span>'; }).join('');
    return '<div class="cv">' +
      '<div class="cv-tabs">' + (spec.tabs || []).map(function (t) { return '<div class="cv-tab' + (t.on ? ' on' : '') + '">' + fileIcon(t.t) + '<span>' + t.n + '</span></div>'; }).join('') + '</div>' +
      '<div class="cv-crumb">' + esc(spec.crumb || '') + '</div>' +
      '<div class="cv-body"><div class="cv-gutter">' + gutter + '</div><div class="cv-code">' + body + '</div></div>' +
      (spec.review ? '<div class="cv-review">' + spec.review.map(function (rv) { return '<div class="cv-rv"><span class="cv-rv-dot"></span>' + esc(rv) + '</div>'; }).join('') + '</div>' : '') +
    '</div>';
  }

  /* ============================================================
     Terminal view (Testing / Delivery)
     ============================================================ */
  function terminalHTML(title, lines) {
    var body = (lines || []).map(function (t) {
      if (t.c != null) return '<div class="tm-l"><span class="tm-p">➜</span> <span class="tm-cwd">' + esc(t.cwd || '~/nosto-integration') + '</span> <span class="tm-cmd">' + esc(t.c) + '</span></div>';
      return '<div class="tm-l"><span class="tm-o ' + (t.cls || '') + '">' + esc(t.o) + '</span></div>';
    }).join('');
    return '<div class="tm"><div class="tm-head"><span class="tm-on">' + esc(title || 'Terminal') + '</span><span>Problems</span><span>Output</span><span>Ports</span></div><div class="tm-body">' + body + '</div></div>';
  }

  /* ============================================================
     Intercom article view (Delivery · Documentation station) —
     the factory writes the help article straight into Intercom.
     ============================================================ */
  var INTERCOM_MARK = '<svg viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="8" fill="#1F8DED"/><path d="M8 8.5h12a1.6 1.6 0 0 1 1.6 1.6v5.4a1.6 1.6 0 0 1-1.6 1.6h-5.2L11 21v-3.4H8a1.6 1.6 0 0 1-1.6-1.6v-5.4A1.6 1.6 0 0 1 8 8.5z" fill="#fff"/><path d="M9.7 12.2v1.8M14 11.8v2.6M18.3 12.2v1.8" stroke="#1F8DED" stroke-width="1.5" stroke-linecap="round"/></svg>';
  function intercomHTML() {
    var blocks = [
      { h: 'Before you start' },
      { p: 'You need an active Nosto account with the Nosto Shopify app installed, plus a Nosto API token with customer-data access.' },
      { h: 'Connect Nosto' },
      { ol: [
        'In Nosto, request an API token with customer-data access.',
        'In Notify Me, open Settings → Integrations → Nosto.',
        'Paste the token and select Connect.'
      ] },
      { p: 'New demand activity starts syncing to Nosto right away. Historical demand is not backfilled.' },
      { h: 'What syncs to Nosto' },
      { ul: [
        'Back-in-stock waitlist activity',
        'Wishlist adds',
        'Pre-order intent'
      ] },
      { p: 'Each is written to the shopper\'s Nosto customer profile, keyed by email, as an attribute you can segment and personalize on.' },
      { h: 'Build your first campaign' },
      { p: 'Create a Nosto segment on any demand attribute, then attach it to a pop-up, email, or recommendation. Restock recovery is the highest-converting place to start.' }
    ];
    var body = blocks.map(function (b) {
      if (b.h) return '<div class="ic-h">' + esc(b.h) + '</div>';
      if (b.ol) return '<ol class="ic-ol">' + b.ol.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
      if (b.ul) return '<ul class="ic-ul">' + b.ul.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      return '<p class="ic-p">' + esc(b.p) + '</p>';
    }).join('');
    return '<div class="icv">' +
      '<div class="ic-bar"><span class="ic-mark">' + INTERCOM_MARK + '</span>' +
        '<span class="ic-url">app.intercom.com  ·  Help Center  ·  Articles</span>' +
        '<span class="ic-chip">Published</span></div>' +
      '<div class="ic-page"><div class="ic-article">' +
        '<div class="ic-crumb">All Collections<span class="ic-sep">›</span>Integrations<span class="ic-sep">›</span>Nosto</div>' +
        '<div class="ic-title">Set up the Nosto integration</div>' +
        '<div class="ic-meta"><span class="ic-av">T</span><span>Written by <b>Tous</b></span><span class="ic-mdot">·</span><span>Updated just now</span></div>' +
        body +
        '<div class="ic-foot"><span>Did this answer your question?</span><span class="ic-faces">😞&nbsp;&nbsp;😐&nbsp;&nbsp;😃</span></div>' +
      '</div></div>' +
    '</div>';
  }

  /* code + terminal content, keyed for setContent */
  var NOSTO_SYNC =
    'import { NostoClient } from \'./client\'\n' +
    'import type { DemandEvent } from \'./types\'\n' +
    '\n' +
    '// Map a Notify Me demand event to Nosto profile attributes (nm_*).\n' +
    'export function mapDemandEvent(event: DemandEvent) {\n' +
    '  return {\n' +
    '    nm_email: event.email,\n' +
    '    nm_bis_active: event.type === \'back_in_stock\',\n' +
    '    nm_wishlist_active: event.type === \'wishlist\',\n' +
    '    nm_preorder_customer: event.type === \'pre_order\',\n' +
    '    nm_last_intent_at: event.createdAt,\n' +
    '  }\n' +
    '}\n' +
    '\n' +
    '// Stream one consented demand event to the shopper\'s Nosto profile.\n' +
    'export async function syncDemandEvent(shopId: number, event: DemandEvent) {\n' +
    '  if (!event.consented) return skip(\'no-consent\')\n' +
    '\n' +
    '  const client = NostoClient.forShop(shopId)   // token scoped per shop\n' +
    '  const attrs = mapDemandEvent(event)          // BIS / wishlist / pre-order\n' +
    '\n' +
    '  try {\n' +
    '    await client.updateProfile(event.email, {\n' +
    '      ...attrs,\n' +
    '      source: \'notify-me\',\n' +
    '    })\n' +
    '    return ok(event.email)\n' +
    '  } catch (err) {\n' +
    '    return retryLater(shopId, event, err)      // backoff, then dead-letter\n' +
    '  }\n' +
    '}';
  var CODE_SPECS = {
    coding: { lang: 'ts', crumb: 'nm-backend  ›  src  ›  nosto  ›  sync.ts',
      tabs: [{ n: 'sync.ts', t: 'ts', on: 1 }, { n: 'mapper.ts', t: 'ts' }, { n: 'client.ts', t: 'ts' }], code: NOSTO_SYNC },
    review: { lang: 'ts', crumb: 'nm-backend  ›  src  ›  nosto  ›  sync.ts',
      tabs: [{ n: 'sync.ts', t: 'ts', on: 1 }], code: NOSTO_SYNC,
      review: ['reviewer: writes are idempotent, keyed by email', 'reviewer: shop_id scoped server-side, zero cross-shop leakage', 'approved, ready to merge'] }
  };
  var TERM_SPECS = {
    techqa: { title: 'pnpm test', lines: [
      { c: 'pnpm test nosto', cwd: '~/nm-backend' },
      { o: 'PASS  nosto/sync.test.ts   (18 tests)', cls: 'ok' },
      { o: 'PASS  nosto/mapper.test.ts (11 tests)', cls: 'ok' },
      { o: '29 passed · 0 failed · 2.4s', cls: 'ok' }
    ] },
    productqa: { title: 'zsh', lines: [
      { c: 'tous qa:product --flows connect,sync', cwd: '~/nosto-integration' },
      { o: '✓ connect: valid token accepted, invalid rejected', cls: 'ok' },
      { o: '✓ sync: BIS / wishlist / pre-order reach the Nosto profile', cls: 'ok' },
      { o: '✓ consent: opted-out shoppers are skipped', cls: 'ok' },
      { o: 'product QA green', cls: 'ok' }
    ] },
    release: { title: 'zsh', lines: [
      { c: 'git commit -m "feat(nosto): demand sync (beta)"', cwd: '~/nosto-integration' },
      { c: 'gh pr merge 918 --squash', cwd: '~/nosto-integration' },
      { o: '✓ PR #918 merged to main', cls: 'ok' },
      { c: 'flags set nosto_sync --rollout 10% --plans all', cwd: '~/nosto-integration' },
      { o: '✓ live · 10% of shops · ramping', cls: 'ok' }
    ] }
  };

  /* ============================================================
     The beats
     ============================================================ */
  var PROMPT = 'Build the Nosto integration for Notify Me. Sync our demand signals into Nosto and run the Tous workflow.';
  var PLACEHOLDER = 'Ask Tous to build a feature…';

  var BEATS = [
    /* 0 — hero */
    { view: 'hero', claude: 'full', agentState: 'idle', wfMode: 'hidden' },

    /* 1 — VS Code: explorer + full-width Claude panel (ready) */
    { view: 'ide', claude: 'full', agentState: 'idle', wfMode: 'hidden',
      show: ['dclaude', 'docs', 'signals', 'nostoapi', 'ni', 'research', 'readme', 'claudemd'],
      ready: 1, status: 'orchestrator idle' },

    /* 2 — user types + sends -> the Tous workflow starts */
    { view: 'ide', claude: 'full', agentState: 'run', wfMode: 'hidden',
      type: PROMPT, ask: PROMPT,
      agent: [ T('Skill', 'tous-orchestrator', 'SOP loaded'), L('plan', 'mapped the request to **6 stages · 18 stations**') ],
      status: 'orchestrator · planning', ctx: 'context 18%' },

    /* 3 — split + jump straight into Market Research: the tracker appears (progress lives there,
           no big "Stage 01" screen), and a browser reads nosto.com + our docs */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 0, wfExpand: 1,
      content: 'browser', check: [['research', 'market', 'run']],
      agent: [
        T('Task', 'researcher', 'stage 01 · dispatched'),
        T('Skill', 'market-research', 'SOP loaded'),
        T('WebFetch', 'nosto.com/platform', 'segments · events · audiences'),
        T('WebRead', 'notify-me-docs/demand-signals.md', 'BIS · wishlist · pre-order'),
        L('map', 'demand signals -> **Nosto audiences**')
      ],
      status: 'researcher · market-research', ctx: 'context 34%' },

    /* 4 — market-research.md rendered (Market Research checked) */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 0, wfExpand: 1,
      content: 'doc:mr', show: ['mr'], activeFile: 'mr',
      check: [['research', 'market', 'done']],
      agent: [
        T('Write', 'research/market-research.md', 'signal · market · opportunity'),
        R('market-research.md', 'compiled · 12 sources', 'blue')
      ],
      status: 'researcher · market-research ✓' },

    /* 5 — prd.md rendered (PRD checked) -> Research stage done */
    { view: 'ide', claude: 'dock', agentState: 'done', wfMode: 'full', wfActive: 0, wfExpand: 1,
      content: 'doc:prd', show: ['prd'], activeFile: 'prd',
      check: [['research', 'prd', 'done']],
      agent: [
        T('Skill', 'prd', 'SOP loaded'),
        T('Read', 'market-research.md', 'grounding the PRD'),
        T('Write', 'research/prd.md', 'problem · users · capabilities · rollout'),
        R('prd.md', 'approved · ready for design', 'blue')
      ],
      status: 'PRD · ready for design', ctx: 'context 41%' },

    /* ===== DESIGN (stage 02, coral) ===== */
    /* 6 — UI/UX Design: design the Nosto integration UI, live preview */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 1, wfExpand: 1, resetAgent: 1,
      content: 'design:v1', check: [['design', 'uiux', 'done']],
      agent: [
        T('Task', 'product-designer', 'stage 02 · dispatched'),
        T('Skill', 'design', 'SOP loaded'),
        T('Read', 'prd.md', 'capabilities + states'),
        L('build', 'Figma Make + Polaris · the Connect to Nosto page')
      ],
      status: 'product-designer · UI/UX', ctx: 'context 48%' },

    /* 7 — Design Review: no view change; the UI/UX design stays up, only the tracker step ticks */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 1, wfExpand: 1,
      check: [['design', 'review', 'done']],
      agent: [
        T('Task', 'design-reviewer', 'review'),
        L('review', 'states, contrast and copy checked against the PRD'),
        R('design', 'reviewed · ready for handoff', 'coral')
      ],
      status: 'reviewer · design' },

    /* 8 — Design Handoff: handoff.md with the screens + details */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 1, wfExpand: 1,
      content: 'doc:handoff', show: ['handoff'], activeFile: 'handoff',
      check: [['design', 'handoff', 'done']],
      agent: [
        T('Skill', 'design-handoff', 'SOP loaded'),
        T('Write', 'design/handoff.md', 'screens · anatomy · states'),
        R('handoff.md', 'delivered → engineering', 'coral')
      ],
      status: 'design · handoff ✓' },

    /* ===== ENGINEERING (stage 03, blue) — fast, just the process ===== */
    /* 9 — Technical Definition of Done */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 2, wfExpand: 1, resetAgent: 1,
      content: 'doc:dod', show: ['dod'], activeFile: 'dod',
      check: [['engineering', 'dod', 'done'], ['engineering', 'dodrev', 'done']],
      agent: [
        T('Skill', 'engineering', 'SOP loaded'),
        T('Read', 'prd.md', 'capabilities'),
        T('Write', 'engineering/dod.md', 'done criteria'),
        H('guard: shop_id scoped server-side')
      ],
      status: 'engineering · DoD', ctx: 'context 55%' },

    /* 10 — Technical Planning */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 2, wfExpand: 1,
      content: 'doc:plan', show: ['plan'], activeFile: 'plan',
      check: [['engineering', 'planning', 'done'], ['engineering', 'planrev', 'done']],
      agent: [
        T('Write', 'engineering/plan.md', 'two planes · contract'),
        R('plan.md', 'reviewed · ready to build', 'blue')
      ],
      status: 'engineering · plan ✓' },

    /* ===== PRODUCTION (stage 04, blue) ===== */
    /* 11 — Coding */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 3, wfExpand: 1, resetAgent: 1,
      content: 'code:coding', check: [['production', 'coding', 'done']],
      agent: [
        T('Task', 'backend · frontend · sdk', 'dispatched'),
        T('Edit', 'nosto/sync.ts', 'demand event → Nosto profile'),
        T('Edit', 'NostoConnect.tsx', 'token validate + connect'),
        L('build', 'queue drains demand events to Nosto')
      ],
      status: 'engineers · coding', ctx: 'context 63%' },

    /* 12 — Code Review */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 3, wfExpand: 1,
      content: 'code:review', check: [['production', 'codereview', 'done']],
      agent: [
        T('Task', 'code-reviewer', 'review'),
        L('review', 'idempotent · shop-scoped · no leakage'),
        R('3 files', 'approved · merged', 'blue')
      ],
      status: 'reviewer · code ✓' },

    /* ===== TESTING (stage 05, mint) ===== */
    /* 13 — Technical QA */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 4, wfExpand: 1, resetAgent: 1,
      content: 'term:techqa', check: [['testing', 'techqa', 'done']],
      agent: [
        T('Skill', 'qa', 'SOP loaded'),
        T('Bash', 'pnpm test nosto', '29 passed'),
        H('verify-on-stop: evidence required → ✓')
      ],
      status: 'qa · technical', ctx: 'context 70%' },

    /* 14 — Product QA */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 4, wfExpand: 1,
      content: 'term:productqa', check: [['testing', 'productqa', 'done']],
      agent: [ T('Bash', 'tous qa:product', 'connect · sync · consent ✓') ],
      status: 'qa · product' },

    /* 15 — Visual QA (the shipped UI, verified against baselines) */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 4, wfExpand: 1,
      content: 'design:v2', check: [['testing', 'visualqa', 'done']],
      agent: [
        T('Bash', 'tous qa:visual', '4 states matched · 0 diffs'),
        R('QA green', 'technical · product · visual', 'mint')
      ],
      status: 'qa · visual ✓' },

    /* ===== DELIVERY & LEARNING (stage 06, mint) ===== */
    /* 16 — Release */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 5, wfExpand: 1, resetAgent: 1,
      content: 'term:release', check: [['delivery', 'release', 'done']],
      agent: [
        T('Skill', 'release', 'SOP loaded'),
        T('Bash', 'gh pr merge 918', 'squashed to main'),
        T('Bash', 'flags set nosto_sync 10%', 'live · all plans')
      ],
      status: 'delivery · release', ctx: 'context 78%' },

    /* 17 — Release Announcement */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 5, wfExpand: 1,
      content: 'doc:announce', show: ['changelog'], activeFile: 'changelog',
      check: [['delivery', 'announce', 'done']],
      agent: [
        T('Write', 'delivery/CHANGELOG.md', 'new · rollout'),
        L('announce', 'changelog + in-app release note')
      ],
      status: 'delivery · announcement' },

    /* 18 — Documentation: write the help article straight into Intercom */
    { view: 'ide', claude: 'dock', agentState: 'run', wfMode: 'full', wfActive: 5, wfExpand: 1,
      content: 'intercom',
      check: [['delivery', 'documentation', 'done']],
      agent: [
        T('Skill', 'documentation', 'SOP loaded'),
        T('Intercom', 'create-article', 'Set up the Nosto integration'),
        R('help article', 'published to the Help Center', 'mint')
      ],
      status: 'delivery · documentation' },

    /* 19 — Learning: the ledger updates, the factory loops back */
    { view: 'ide', claude: 'dock', agentState: 'done', wfMode: 'full', wfActive: 5, wfExpand: 1,
      content: 'doc:learn', show: ['learn'], activeFile: 'learn',
      check: [['delivery', 'learning', 'done']],
      agent: [
        L('advice_ledger', 'predicted vs actual outcome logged'),
        T('Write', 'delivery/learnings.md', 'patterns kept'),
        R('shipped + learning', 'the factory loops back', 'mint')
      ],
      status: 'shipped · the loop closes', ctx: 'context 84%' }
  ];

  /* ------------------------------------------------------------
     Auto-play. Each beat belongs to a segment; the run auto-advances
     BETWEEN beats of the same segment, then STOPS at a segment's last
     beat and waits for a manual advance (-> / space / click) before the
     next stage begins. BEAT_HOLD is the dwell (ms) before auto-advancing;
     0 marks a stop. Manual advance always works and resumes the next segment.
     Each STAGE is one segment: its steps auto-advance, then it stops at the
     stage's last step and waits for a manual advance before the next stage.
     Research bundles the intro (hero/VS Code/prompt). Dwells are brisk but
     readable; Engineering is fastest ("just the process"). 0 marks a stop.
     ------------------------------------------------------------ */
  var BEAT_SEG = [
    'research', 'research', 'research', 'research', 'research', 'research', // 0-5
    'design', 'design', 'design',                                          // 6-8
    'engineering', 'engineering',                                          // 9-10
    'production', 'production',                                            // 11-12
    'testing', 'testing', 'testing',                                       // 13-15
    'delivery', 'delivery', 'delivery', 'delivery'                         // 16-19
  ];
  var BEAT_HOLD = [
    2100, 1600, 2600, 2600, 3000, 0,   // research
    2600, 1400, 0,                     // design (UI/UX, review-quick, handoff-stop)
    2000, 0,                           // engineering (DoD, plan-stop) — fast
    2400, 0,                           // production (coding, review-stop)
    2000, 2000, 0,                     // testing (tech, product, visual-stop)
    2100, 2300, 2300, 0                // delivery (release, announce, docs, learning-stop)
  ];

  /* ============================================================
     Transcript renderers
     ============================================================ */
  function toolCallHTML(fn, arg, out) {
    return '<div class="cl-act"><div class="cl-line"><span class="cl-dot"></span><span class="cl-call"><b>' + esc(fn) + '</b>' +
      '<span class="cl-paren">(</span><span class="cl-arg">' + esc(arg) + '</span><span class="cl-paren">)</span></span></div>' +
      (out ? '<div class="cl-res"><span class="cl-el"></span><span>' + esc(out) + '</span></div>' : '') + '</div>';
  }
  function agentItemHTML(it) {
    if (it.tool) return toolCallHTML(it.fn, it.arg, it.out);
    if (it.hook) return '<div class="cl-hook"><span class="cl-el"></span><span class="cl-hk">hook</span><span class="cl-hx">' + esc(it.x) + '</span></div>';
    if (it.report) return '<div class="cl-done ' + (it.tone || '') + '"><span class="cl-ck">' + CHECK + '</span><span><b>' + esc(it.f) + '</b> · ' + esc(it.note) + '</span></div>';
    return '<div class="cl-act text"><div class="cl-line"><span class="cl-dot"></span><span>' + boldify('<b>' + esc(it.b) + '</b> ' + esc(it.x)) + '</span></div></div>';
  }
  function askHTML(ask) { return '<div class="cl-user"><span class="cl-gt">&gt;</span><span>' + esc(ask) + '</span></div>'; }
  function readyHTML() {
    return '<div class="cl-ready"><span class="lg">' + CL_LOGO + '</span>' +
      '<h4>Ready to build.</h4>' +
      '<p>Describe a feature. Tous plans the run and takes it through all six stages, start to finish.</p>' +
      '<div class="hintkey">▸ press <b>&rarr;</b> to send the request</div></div>';
  }

  /* ============================================================
     Engine
     ============================================================ */
  var WT = {
    gen: 0, timers: [], cur: -1, progress: {}, activeStage: 0, expandStage: false, wfMode: 'hidden',

    els: {
      stage: $('wtStage'), tree: $('vsTree'), main: $('vsMain'), view: $('vsView'),
      wf: $('wf'), wfList: $('wfList'), wfCount: $('wfCount'),
      agent: $('vsAgent'), agentBody: $('vsAgentBody'), agentState: $('vsAgentState'),
      status: $('vsStatusTask'), ph: $('clPh'), input: null, send: $('clSend'), ctx: $('clCtx')
    },

    clearTimers: function () { this.timers.forEach(clearTimeout); this.timers = []; },
    at: function (fn, ms) { var g = this.gen, self = this; this.timers.push(setTimeout(function () { if (g === self.gen) fn(); }, ms)); },

    /* ---- one-time DOM: explorer + tracker ---- */
    build: function () {
      var tr = '';
      TREE.forEach(function (n) {
        var tw = (n.t === 'diro') ? '▾' : (n.t === 'dir') ? '▸' : '';
        tr += '<div class="vs-row ' + (n.t === 'diro' || n.t === 'dir' ? 'dir' : '') + (n.hidden ? ' hidden' : '') + '" data-id="' + n.id + '" data-depth="' + n.d + '">' +
          '<span class="tw">' + tw + '</span>' + fileIcon(n.t) + '<span class="nm">' + n.name + '</span>' +
          (n.tail || n.t === 'diro' || n.t === 'dir' ? '' : '<span class="badge-new">NEW</span>') + '</div>';
      });
      this.els.tree.innerHTML = tr;

      var wl = '';
      STAGES.forEach(function (st, i) {
        var stations = st.stations.map(function (s) {
          return '<li class="owf-st"><span class="owf-cb">' + CHECK_FILL + '</span><span class="owf-stname">' + s.name + '</span></li>';
        }).join('');
        wl += '<li class="owf-stage ac-' + st.ac + '" data-i="' + i + '">' +
          '<div class="owf-srow"><span class="owf-dot"><span class="owf-num">' + (i + 1) + '</span>' + CHECK + '</span>' +
          '<span class="owf-name">' + st.name + '</span><span class="owf-sc"></span></div>' +
          '<ul class="owf-stations">' + stations + '</ul></li>';
      });
      this.els.wfList.innerHTML = wl;
      this.els.input = this.els.send ? this.els.send.parentNode : null;
    },

    /* ---- apply the tracker state from this.progress / activeStage ---- */
    applyWf: function () {
      var self = this;
      [].forEach.call(this.els.wfList.children, function (li, si) {
        var st = STAGES[si], prog = self.progress[st.key] || {};
        var doneCount = 0;
        st.stations.forEach(function (s) { if (prog[s.key || s.name] === 'done') doneCount++; });
        var allDone = st.stations.length > 0 && doneCount === st.stations.length;
        var isActive = si === self.activeStage;   // active stage stays expanded, even once complete
        li.classList.toggle('active', isActive);
        li.classList.toggle('expand', isActive && self.expandStage);
        li.classList.toggle('complete', allDone);          // dot shows the mint check whenever all stations are done
        li.classList.toggle('done', allDone && !isActive); // collapsed + dimmed only once we've moved past it
        var sc = li.querySelector('.owf-sc');
        if (sc) sc.textContent = st.stations.length ? (doneCount + '/' + st.stations.length) : '';
        [].forEach.call(li.querySelectorAll('.owf-st'), function (stEl, k) {
          var s = st.stations[k], v = prog[s.key || s.name];
          stEl.classList.toggle('run', v === 'run');
          stEl.classList.toggle('done', v === 'done');
        });
      });
      this.els.wf.dataset.mode = this.wfMode;
      this.els.wfCount.textContent = 'stage ' + (this.activeStage + 1) + ' / ' + STAGES.length;
    },

    /* ---- explorer: reveal files, set the active one ---- */
    revealFiles: function (ids, animate) {
      var E = this.els;
      (ids || []).forEach(function (id) {
        var row = E.tree.querySelector('.vs-row[data-id="' + id + '"]');
        if (row && row.classList.contains('hidden')) {
          row.classList.remove('hidden');
          if (animate) { void row.offsetWidth; row.classList.add('appear', 'flash'); }
        }
      });
    },
    setActiveFile: function (id) {
      var E = this.els;
      [].forEach.call(E.tree.querySelectorAll('.vs-row'), function (e) { e.classList.remove('active'); });
      if (!id) return;
      var row = E.tree.querySelector('.vs-row[data-id="' + id + '"]');
      if (row) { row.classList.remove('hidden'); row.classList.add('active'); }
    },

    /* ---- content viewport ---- */
    setContent: function (spec, animate) {
      var E = this.els, live = animate && !STATIC;
      if (!spec) { E.view.innerHTML = ''; return; }
      if (spec === 'browser') { E.view.innerHTML = browserHTML(); return; }
      if (spec === 'plan') { E.view.innerHTML = planHTML(); return; }
      if (spec.indexOf('design:') === 0) { E.view.innerHTML = designPreviewHTML(spec.slice(7)); return; }
      if (spec.indexOf('code:') === 0) {
        // the file is written line by line, like real coding, with a caret
        E.view.innerHTML = codeHTML(CODE_SPECS[spec.slice(5)]);
        var codeEl = E.view.querySelector('.cv-code'), rev = E.view.querySelector('.cv-review');
        if (rev) { rev.style.opacity = live ? '0' : '1'; }
        this.playWrite(codeEl, [].slice.call(E.view.querySelectorAll('.ck-line')), 42, live, function () {
          if (rev) { rev.style.transition = 'opacity .45s ease'; rev.style.opacity = '1'; }
        });
        return;
      }
      if (spec.indexOf('term:') === 0) {
        var ts = TERM_SPECS[spec.slice(5)]; E.view.innerHTML = terminalHTML(ts.title, ts.lines);
        this.playWrite(E.view.querySelector('.tm-body'), [].slice.call(E.view.querySelectorAll('.tm-l')), 150, live);
        return;
      }
      if (spec === 'intercom') {
        // the help article is written straight into Intercom, block by block
        E.view.innerHTML = intercomHTML();
        this.playWrite(E.view.querySelector('.ic-page'), [].slice.call(E.view.querySelectorAll('.ic-article > *')), 110, live);
        return;
      }
      if (spec.indexOf('doc:') === 0) {
        // the doc is written block by block, scrolling to follow the writing head
        E.view.innerHTML = docHTML(DOCS[spec.slice(4)]);
        var scroll = E.view.querySelector('.doc-scroll'), page = E.view.querySelector('.doc-page');
        if (page) this.playWrite(scroll, [].slice.call(page.children), 100, live);
        return;
      }
      E.view.innerHTML = '';
    },

    /* ---- write a view out sequentially: reveal items one by one with a caret,
           and scroll the container so the writing head stays in view (long docs
           feel long). animate=false reveals everything instantly, scrolled to top. ---- */
    playWrite: function (scrollEl, items, perMs, animate, done) {
      var self = this;
      if (!items || !items.length) { if (done) done(); return; }
      if (!animate) {
        items.forEach(function (el) { el.classList.add('in'); });
        if (scrollEl) scrollEl.scrollTop = 0;
        if (done) done();
        return;
      }
      var caret = node('<span class="wr-caret"></span>'), i = 0;
      function step() {
        if (i >= items.length) { if (caret.parentNode) caret.parentNode.removeChild(caret); if (done) done(); return; }
        var el = items[i]; el.classList.add('in'); el.appendChild(caret);
        if (scrollEl) {
          // viewport-relative: how far the just-written block's bottom sits past the fold
          var er = el.getBoundingClientRect(), sr = scrollEl.getBoundingClientRect();
          var over = er.bottom - sr.bottom;
          if (over > -24) scrollEl.scrollTop += over + 40;   // keep the writing head just above the fold
        }
        i++;
        self.at(step, perMs);
      }
      step();
    },

    /* ---- append this beat's transcript lines ---- */
    appendAgent: function (beat, animate) {
      var E = this.els, self = this, els = [];
      if (beat.ask) { var a = node(askHTML(beat.ask)); E.agentBody.appendChild(a); els.push(a); }
      (beat.agent || []).forEach(function (it) { var d = node(agentItemHTML(it)); E.agentBody.appendChild(d); els.push(d); });
      if (animate) {
        var t = 40;
        els.forEach(function (el) { self.at(function () { el.classList.add('in'); E.agentBody.scrollTop = E.agentBody.scrollHeight; }, t); t += 210; });
      } else {
        els.forEach(function (el) { el.classList.add('in'); });
        E.agentBody.scrollTop = E.agentBody.scrollHeight;
      }
    },

    /* ---- type the prompt into the composer, then "send" ---- */
    typePrompt: function (text, done) {
      var E = this.els, self = this, i = 0;
      if (E.input) E.input.classList.add('focus');
      function step() {
        if (i > text.length) {
          if (E.input) { E.input.classList.remove('focus'); E.input.classList.add('send'); }
          self.at(function () { if (E.input) E.input.classList.remove('send'); if (E.ph) { E.ph.textContent = PLACEHOLDER; E.ph.classList.remove('typed'); } done(); }, 200);
          return;
        }
        if (E.ph) { E.ph.classList.add('typed'); E.ph.innerHTML = esc(text.slice(0, i)) + '<span class="cur"></span>'; }
        i++;
        self.at(step, 10);
      }
      step();
    },

    /* ---- reset to the very start ---- */
    reset: function () {
      this.gen++; this.clearTimers();
      this.cur = -1; this.progress = {}; this.activeStage = 0; this.expandStage = false; this.wfMode = 'hidden';
      SLIDE.removeAttribute('data-done');
      var E = this.els;
      E.stage.dataset.view = 'hero';
      E.main.dataset.claude = 'full';
      E.agent.dataset.state = 'idle'; E.agentState.textContent = 'idle';
      E.agentBody.innerHTML = ''; E.agentBody.classList.remove('convo');
      E.view.innerHTML = '';
      if (E.ph) { E.ph.textContent = PLACEHOLDER; E.ph.classList.remove('typed'); }
      if (E.ctx) E.ctx.textContent = 'context 12%';
      E.status.textContent = 'orchestrator idle';
      [].forEach.call(E.tree.querySelectorAll('.vs-row'), function (e) {
        e.classList.remove('active', 'appear', 'flash');
        if (TREE.some(function (n) { return n.id === e.dataset.id && n.hidden; })) e.classList.add('hidden');
      });
      this.applyWf();
    },

    /* ---- enter a beat: set the frame, then animate the delta ---- */
    enterBeat: function (i, animate) {
      var E = this.els, beat = BEATS[i], self = this;
      this.cur = i;

      // frame
      E.stage.dataset.view = beat.view;
      if (beat.claude) E.main.dataset.claude = beat.claude;
      if (beat.agentState) { E.agent.dataset.state = beat.agentState; E.agentState.textContent = beat.agentState === 'run' ? 'running' : beat.agentState; }
      if (beat.status != null) E.status.textContent = beat.status;
      if (beat.ctx && E.ctx) E.ctx.textContent = beat.ctx;

      // explorer
      if (beat.show) this.revealFiles(beat.show, animate);
      if (beat.activeFile) this.setActiveFile(beat.activeFile); else if (beat.view === 'ide' && !beat.ready) this.setActiveFile(null);

      // tracker state
      if (beat.wfMode) this.wfMode = beat.wfMode;
      if (beat.wfActive != null) this.activeStage = beat.wfActive;
      if (beat.wfExpand != null) this.expandStage = !!beat.wfExpand;
      (beat.check || []).forEach(function (c) {
        var sk = c[0]; self.progress[sk] = self.progress[sk] || {}; self.progress[sk][c[1]] = c[2];
      });
      this.applyWf();

      // ready hint (full-width claude)
      if (beat.ready) { E.agentBody.classList.remove('convo'); E.agentBody.innerHTML = readyHTML(); }

      // content
      if (beat.content !== undefined) this.setContent(beat.content, animate);

      // transcript + typing. doAgent(anim) reveals this beat's lines; _pending lets a fast
      // advance force-complete it (so the prompt + boot lines are never skipped).
      this._pending = null;
      if (beat.resetAgent) E.agentBody.innerHTML = '';   // each stage gets a fresh transcript
      var doAgent = function (anim) {
        if (beat.ask || beat.agent) { E.agentBody.classList.add('convo'); if (E.agentBody.querySelector('.cl-ready')) E.agentBody.innerHTML = ''; }
        self.appendAgent(beat, anim);
      };
      if (beat.type && animate) {
        this._pending = function () { if (E.ph) { E.ph.textContent = PLACEHOLDER; E.ph.classList.remove('typed'); } doAgent(false); };
        this.typePrompt(beat.type, function () { self._pending = null; doAgent(true); });
      } else {
        if (beat.type && !animate && E.ph) { E.ph.textContent = PLACEHOLDER; }
        doAgent(animate);
      }

      // auto-play: queue the next beat only while it stays inside this segment;
      // at a segment boundary the run stops and waits for a manual advance.
      if (animate && !STATIC) {
        var nx = i + 1;
        if (nx < BEATS.length && BEAT_SEG[nx] === BEAT_SEG[i]) {
          this.at(function () { self.autoAdvance(); }, BEAT_HOLD[i] || 3200);
        }
      }
    },

    /* ---- auto-advance to the next beat within a segment (timer-driven) ---- */
    autoAdvance: function () {
      var next = this.cur + 1;
      if (next >= BEATS.length) return;
      this.settleCurrent();
      this.enterBeat(next, true);
    },

    /* ---- force-complete the current beat's in-flight animation (on advance) so
           nothing gets skipped if the presenter clicks through fast ---- */
    settleCurrent: function () {
      this.gen++; this.clearTimers();
      if (this._pending) { var p = this._pending; this._pending = null; p(); }
      [].forEach.call(this.els.agentBody.querySelectorAll('.ag-line'), function (el) { el.classList.add('in'); });
      // finish any in-flight written view (doc blocks / code lines / terminal / intercom) + drop the caret
      [].forEach.call(this.els.view.querySelectorAll('.doc-page > *, .ck-line, .tm-l, .ic-article > *'), function (el) { el.classList.add('in'); });
      var cr = this.els.view.querySelector('.wr-caret'); if (cr && cr.parentNode) cr.parentNode.removeChild(cr);
      var rev = this.els.view.querySelector('.cv-review'); if (rev) rev.style.opacity = '1';
      this.els.agentBody.scrollTop = this.els.agentBody.scrollHeight;
    },

    /* ---- advance / replay ---- */
    advance: function () {
      if (STATIC) { if (window.Reveal) Reveal.next(); return; }
      var next = this.cur + 1;
      this.settleCurrent();   // finish the current beat first, so nothing is skipped
      if (next >= BEATS.length) { SLIDE.setAttribute('data-done', 'all'); if (window.Reveal) Reveal.next(); return; }
      this.enterBeat(next, true);
    },
    replay: function () { this.start(); },

    /* ---- step backward: rebuild the previous beat's settled state, instantly and
           with no auto-advance armed (the run pauses there; -> resumes it). Before
           the first beat, hand back to reveal.js to leave the slide. ---- */
    prev: function () {
      if (STATIC) { if (window.Reveal) Reveal.prev(); return; }
      if (this.cur <= 0) { if (window.Reveal) Reveal.prev(); return; }
      this.renderStatic(this.cur - 1);   // rebuild cumulative state at cur-1 (no animation, no auto)
    },

    /* ---- static render: cumulative state up to beat `upto` ---- */
    renderStatic: function (upto) {
      this.reset();
      var top = (upto == null) ? BEATS.length - 1 : Math.max(0, Math.min(BEATS.length - 1, upto));
      for (var i = 0; i <= top; i++) this.enterBeat(i, false);
      if (top >= BEATS.length - 1) SLIDE.setAttribute('data-done', 'all');
    },

    /* ---- entry ---- */
    start: function () {
      this.reset();
      if (STATIC) {
        var wp = new URLSearchParams(location.search);
        var b = wp.has('wbeat') ? (parseInt(wp.get('wbeat'), 10) || 0) : null;
        this.renderStatic(b);   // null -> the finished state
        return;
      }
      var self = this;
      this.at(function () { self.enterBeat(0, true); }, 200);
    }
  };

  WT.build();

  /* ============================================================
     Wiring: keys, click, reveal.js
     ============================================================ */
  function onSlide() { return window.Reveal && Reveal.getCurrentSlide && Reveal.getCurrentSlide() === SLIDE; }

  document.addEventListener('keydown', function (e) {
    if (!onSlide() || STATIC) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === ' ' || k === 'Spacebar' || k === 'PageDown' || k === 's' || k === 'S') {
      e.preventDefault(); e.stopImmediatePropagation(); WT.advance();
    } else if (k === 'ArrowLeft' || k === 'PageUp') {
      e.preventDefault(); e.stopImmediatePropagation(); WT.prev();   // step back a beat, don't leave the slide
    } else if (k === 'r' || k === 'R') {
      e.preventDefault(); e.stopImmediatePropagation(); WT.replay();
    }
  }, true);

  SLIDE.addEventListener('click', function (ev) {
    if (STATIC) return;
    if (ev.target.closest('a')) return;
    WT.advance();
  });

  function boot() {
    if (!window.Reveal) return;
    Reveal.on('slidechanged', function (ev) {
      if (ev.currentSlide === SLIDE) WT.start();
      else if (ev.previousSlide === SLIDE) { WT.gen++; WT.clearTimers(); }
    });
    if (onSlide()) WT.start();   // start() reads ?wbeat for a frozen QA beat
  }

  if (window.Reveal && Reveal.isReady && Reveal.isReady()) boot();
  else if (window.Reveal) Reveal.on('ready', boot);
  else window.addEventListener('load', boot);
})();
