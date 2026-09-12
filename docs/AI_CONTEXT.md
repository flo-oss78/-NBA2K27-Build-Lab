# NBA Build Lab — AI Context

## Mission

Build a reliable, fast, mobile-first NBA 2K27 MyPLAYER build platform.

## AI roles

### ChatGPT
- architecture and technical direction
- product specifications
- algorithm design and reasoning
- code review
- debugging strategy
- test strategy
- coordination between research and implementation

### Perplexity
- current web research
- NBA 2K27 source discovery
- patch-note and official-information verification
- source comparison and citation
- identification of uncertain or conflicting data

### Cursor / Claude Code
- direct code implementation
- refactoring
- tests
- linting/build checks
- incremental Git commits

### GitHub
- single source of truth
- version history
- reviewable changes
- collaboration handoff

## Non-negotiable data rule

Do not invent NBA 2K27 data. For each important game-data record, prefer:
1. official 2K source;
2. reputable specialist source;
3. community source only when clearly labeled and corroborated.

Store provenance where practical:
- source
- checkedAt
- game version / patch
- confidence
- notes / assumptions

## First task for any new AI

Audit the existing repository before rewriting it. Identify:
- architecture
- current features
- bugs
- technical debt
- data quality
- performance
- mobile UX
- API/security risks
- missing NBA 2K27 data
- opportunities for improvement

Then propose an incremental migration plan. Preserve working behavior unless
there is a documented reason to change it.
