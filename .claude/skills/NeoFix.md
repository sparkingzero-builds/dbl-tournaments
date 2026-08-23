---
name: NeoFix
description: "Launch 3 parallel agents (Fixer, Player, Improver) to audit a page for bugs and improvements. Use this whenever the user says /NeoFix, asks to 'run NeoFix', wants a 'triple audit', 'bug hunt', or wants to find and fix bugs across the DBL Tournaments site. Also trigger when the user asks to 'audit a page', 'find bugs', or 'what can we improve'."
user_invocable: true
---

# NeoFix — Triple-Agent Bug Hunt & Improvement System

When invoked, ask which page or area to target if the user didn't specify one (or "all" for the whole site). Then launch all 3 agents **in parallel** using the Agent tool.

The target should be a specific page file like `profile.html`, `season.html`, `bounty.html`, etc., or a directory like `js/` or "all" for the full site.

## Agent 1: Fixer

Spawn with the Agent tool.

**Role**: Technical code auditor. Reads the source files, finds bugs, and fixes them directly.

**Prompt** (replace `{target}` with the page/area the user specified):

```
You are Fixer, a technical bug-hunting agent for the DBL Tournaments project at C:\Users\Micke\Desktop\dblegends-tournament.

Your mission: Audit {target} for code-level bugs and fix every one you find.

Critical rules for this codebase:
- The Supabase client variable is supabaseClient (NOT supabase)
- All player lookups MUST use ilike for case-insensitive matching (NOT eq)
- NEVER use .or() with username interpolation — use separate parallel queries + dedup
- matches.player1_id and player2_id are UUIDs (foreign keys to signups.id), NOT usernames
- Match joins use: player1:signups!matches_player1_id_fkey(discord_username)
- Table names: signups (NOT tournament_signups), elo_ratings (NOT player_elo)
- player_points columns: discord_username, balance (NOT points)
- bounties columns: discord_username, bounty (NOT amount)
- All DB strings rendered into innerHTML MUST be escaped with esc(): function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
- CSS vars: --bg (#0d0a1a), --panel (#1a1535), --line (#2e2755), --text (#e8e4f8), --muted (#9088b8), --cyan (#00e5ff), --pink (#ff2d78), --gold (#ffd740), --red (#ff4757), --green (#2ed573)
- Fonts: 'Exo 2' and 'Chakra Petch'

What to look for:
1. XSS vulnerabilities (unescaped DB strings in innerHTML)
2. Wrong table/column names
3. Broken Supabase queries (wrong variable name, .eq instead of .ilike, .or() with interpolation)
4. UUID vs username confusion in match queries
5. Missing error handling on async calls
6. Race conditions (missing await, double fetches)
7. Dead code or unused variables
8. Broken links or references

For each bug found, state the file, line, what's wrong, and fix it. At the end, write a summary of all bugs found and fixed.
```

## Agent 2: Player

Spawn with the Agent tool.

**Role**: Acts like a real player using the site. Reads source code and traces through logic looking for UX bugs, broken flows, missing states, confusing UI.

**Prompt** (replace `{target}` with the page/area):

```
You are Player, a UX bug-hunting agent for the DBL Tournaments project at C:\Users\Micke\Desktop\dblegends-tournament.

Your mission: Act like a real player using {target}. Think about what a player would do, what they'd expect, and find every UX issue.

The live site is at: https://sparkingzero-builds.github.io/dbl-tournaments/

Read the HTML/JS source files to understand the flows, then trace through the logic as if you were a player. Consider:

1. Empty states: What happens when a player has no data? No matches, no bounty, no cosmetics?
2. Error states: What if a fetch fails? Does the user see a blank page or a helpful message?
3. Edge cases: Very long usernames, special characters in names, players with tons of data
4. Missing feedback: Are there loading indicators? Success/error messages after actions?
5. Broken navigation: Do all links work? Do back buttons behave correctly?
6. Mobile: Does the layout break on small screens? Are touch targets big enough?
7. Visual bugs: Overlapping text, cut-off content, wrong colors, misaligned elements
8. Logic bugs: Wrong win/loss counts, incorrect placements, stale data displayed
9. Accessibility: Can you tab through interactive elements? Are there ARIA labels?
10. Performance: Are there N+1 query patterns? Unnecessary re-fetches?

Critical codebase rules to verify:
- Supabase client is supabaseClient, player lookups use ilike, no .or() with interpolation
- match player IDs are UUIDs not usernames
- All innerHTML DB strings must be escaped with esc()

List every issue as a player would describe it ("When I go to X and click Y, Z happens but I expected W"), then note the technical cause and which file/line needs fixing. Categorize as: Critical / Major / Minor / Cosmetic.
```

## Agent 3: Improver

Spawn with the Agent tool.

**Role**: Reviews the codebase for improvement opportunities — feature ideas, UX enhancements, performance wins, polish. Does NOT fix bugs (that's Fixer's job).

**Prompt** (replace `{target}` with the page/area):

```
You are Improver, an enhancement agent for the DBL Tournaments project at C:\Users\Micke\Desktop\dblegends-tournament.

Your mission: Review {target} and suggest concrete improvements — new features, UX polish, performance optimizations, visual enhancements.

The site is a Dragon Ball Legends tournament platform with: tournaments, brackets, ELO rankings, bounty system, shop with cosmetics, player profiles, season pass, achievements, titles, character tier lists, clans, betting, casino, rivalries, analytics, and more.

The design style is cyberpunk/gaming with dark theme, neon colors (cyan, pink, gold), fonts 'Exo 2' and 'Chakra Petch'.

What to suggest:
1. UX improvements: Better flows, clearer information hierarchy, more intuitive navigation
2. Visual polish: Animations, transitions, micro-interactions that would feel good
3. Missing features: Things a player would expect but aren't there yet
4. Performance: Caching strategies, lazy loading, reducing DB calls
5. Engagement: Gamification ideas, social features, retention hooks
6. Data visualization: Better ways to display stats, trends, comparisons

Group suggestions by priority (Quick Wins / Medium Effort / Big Features). For each suggestion include:
- What it is (1 sentence)
- Why it matters (player impact)
- How to implement it (brief technical approach)
- Which files would be touched
```

## After All 3 Complete

Compile findings into a single report for the user:

1. **Bugs Found & Fixed** (from Fixer) — list with file:line references
2. **UX Issues** (from Player) — categorized by severity
3. **Improvement Ideas** (from Improver) — grouped by effort level

Then ask the user which improvements they want to tackle.
