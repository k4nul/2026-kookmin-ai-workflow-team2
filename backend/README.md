# Game Backend

Express + TypeScript backend for the relationship training chatbot game. This service owns game state, scoring, events, cooldowns, FAST/REALTIME mode behavior, and persistence.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Build and run compiled output:

```bash
npm run build
npm start
```

Default port is `8081`.

## Environment

Copy `.env.example` to `.env` if local overrides are needed.

Required LLM Gateway setting:

```env
LLM_GATEWAY_BASE_URL=http://localhost:8082
LLM_GATEWAY_API_KEY=dev-internal-key
LLM_GATEWAY_MODEL=gpt5.3-spark
```

The backend never calls the model provider directly. All model generation, intent classification, and optional daily feedback calls go through the LLM Gateway.

## API Examples

Health:

```bash
curl http://localhost:8081/health
```

List girlfriends:

```bash
curl http://localhost:8081/api/girlfriends
```

Create FAST room:

```bash
curl -X POST http://localhost:8081/api/rooms ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_001\",\"girlfriendId\":\"gf_minseo\",\"mode\":\"FAST\"}"
```

Send FAST message:

```bash
curl -X POST http://localhost:8081/api/rooms/{roomId}/messages ^
  -H "Content-Type: application/json" ^
  -d "{\"content\":\"오늘 뭐했어?\",\"replyDelayChoice\":\"NOW\"}"
```

If the LLM Gateway is unavailable, the backend returns a local persona fallback reply.

## FAST Mode

FAST mode uses virtual reply delay choices such as `NOW`, `AFTER_30_MIN`, and `AFTER_NEXT_DAY`.

Every 10 user turns ends the current fast day. The forced girlfriend reply is:

```text
아 너무 졸리네 오늘은 먼저 잘게
```

The backend then writes a day-end system message, optional feedback, increments `fastDay`, and resets FAST counters.

## Cooldown

Forbidden topic scores are deterministic. When `violationScore` reaches 100 or more:

- girlfriend message: `왜 그런식으로 말해? 헤어져`
- system message: `{girlfriendName}가 퇴장했습니다.`
- room status: `COOLDOWN`
- `cooldownUntil`: now + `DEFAULT_COOLDOWN_SECONDS`

During cooldown, message POSTs return HTTP `423` with unlock options. Mock unlock endpoints:

```bash
curl -X POST http://localhost:8081/api/rooms/{roomId}/unlock/ad-complete
curl -X POST http://localhost:8081/api/rooms/{roomId}/unlock/payment-complete
```

Both clear cooldown and reset `violationScore` to 0. No real payment integration exists.

## Sensitive Topics

Sensitive or off-context topics are deterministic backend rules, not LLM decisions. Rules live in `src/config/sensitive-topics.json` and are seeded into SQLite on startup.

Each rule supports:

- `match.keywordGroups`: every group must match at least one keyword.
- `defaultPolicy`: fallback response and score effects.
- `personaPolicies`: girlfriend-specific response and score effects.

Example covered by the default seed:

```text
삼성전자 주식 살까?
```

This matches the finance investment advice rule. Different girlfriends react differently: one may be hurt by the sudden topic change, another may brush it off, and another may redirect the user toward making their own decision.
