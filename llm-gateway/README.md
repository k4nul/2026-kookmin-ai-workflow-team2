# LLM Gateway

LLM Gateway is the internal LLM-only HTTP service for the love-training game. The Game Backend calls this server on port `8082`; this server uses the Codex CLI provider with `gpt5.3-spark` by default, and can still use Ollama when `LLM_PROVIDER=ollama`.

## Purpose

This service handles:

- LLM provider connectivity and model status
- Chat text generation
- Intent classification helper output
- Daily relationship coaching feedback wording
- Timeout handling, fallback responses, and response filtering

This service does not handle:

- Game state, rooms, messages, or persistence
- Relationship score, forbidden word score, event trigger, breakup, cooldown, or day calculation
- Payment/ad unlock, girlfriend selection, or hidden event conditions
- Direct browser/client gameplay APIs

The browser client must call the Game Backend. The Game Backend calls this LLM Gateway with `X-Internal-Api-Key`.

## Requirements

- Node.js
- Codex CLI available on `PATH`
- Default Codex model: `gpt5.3-spark`

For the legacy Ollama provider, set `LLM_PROVIDER=ollama` and run Ollama locally.

For Ollama, install the model if needed:

```bash
ollama pull llama3.2
```

## Environment

Copy `.env.example` to `.env` for local overrides.

```bash
PORT=8082
INTERNAL_API_KEY=dev-internal-key
LLM_PROVIDER=codex
LLM_MODEL=gpt5.3-spark
CODEX_COMMAND=codex
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_KEEP_ALIVE=30m
LLM_TIMEOUT_MS=30000
LLM_MAX_INPUT_CHARS=12000
LLM_MAX_OUTPUT_CHARS=800
NODE_ENV=development
```

## Commands

```bash
cd llm-gateway
npm install
npm run dev
npm run typecheck
npm run test
npm run build
npm start
```

## API

`GET /health` is public. All `/v1` routes require:

```http
X-Internal-Api-Key: dev-internal-key
```

### Health

```http
GET http://localhost:8082/health
```

Returns service status even if the configured provider is unavailable.

### Model Preload

```http
POST http://localhost:8082/v1/model/preload
X-Internal-Api-Key: dev-internal-key
Content-Type: application/json
```

```json
{
  "model": "gpt5.3-spark",
  "keepAlive": "30m"
}
```

### Model Status

```http
GET http://localhost:8082/v1/model/status
X-Internal-Api-Key: dev-internal-key
```

Checks the configured provider status.

### Chat Generation

```http
POST http://localhost:8082/v1/chat/generate
X-Internal-Api-Key: dev-internal-key
Content-Type: application/json
```

```json
{
  "requestId": "req_test_001",
  "model": "gpt5.3-spark",
  "messages": [
    {
      "role": "system",
      "content": "너는 연애 훈련 게임 속 여자친구 캐릭터다. 한국어로 1~3문장만 답한다."
    },
    {
      "role": "user",
      "content": "사용자: 오늘 뭐 했어?\n응답 방향: 살짝 까칠하지만 대화는 이어간다."
    }
  ],
  "metadata": {
    "purpose": "girlfriend_reply",
    "girlfriendId": "gf_minseo"
  }
}
```

If the configured provider is unavailable or times out, this endpoint returns HTTP `200` with deterministic fallback content.

### Intent Classification

```http
POST http://localhost:8082/v1/classify/intent
X-Internal-Api-Key: dev-internal-key
Content-Type: application/json
```

```json
{
  "context": {
    "eventId": "boss_scolded",
    "girlfriendMessage": "오늘 회사에서 부장한테 완전 깨졌어. 진짜 기분 별로야.",
    "userMessage": "오늘 많이 힘들었겠다. 내가 들어줄게."
  }
}
```

Expected supportive replies classify as `SUPPORTIVE`. If parsing or model execution fails, the endpoint returns `UNKNOWN` with `fallback: true`.

### Daily Feedback

```http
POST http://localhost:8082/v1/feedback/daily
X-Internal-Api-Key: dev-internal-key
Content-Type: application/json
```

```json
{
  "girlfriend": {
    "id": "gf_seoa",
    "displayName": "서아",
    "personaType": "CONTEXT_READER"
  },
  "day": 3,
  "summary": {
    "successfulEvents": ["parents_fight"],
    "failedEvents": ["boss_scolded"],
    "timingMistakes": ["NEEDS_SUPPORT 상황에서 3시간 뒤 답장"],
    "contentMistakes": ["감정 무시 표현 사용"],
    "goodBehaviors": ["부모님과 싸운 이야기에 평가하지 않고 기다려줌"]
  }
}
```

The output is concise Korean coaching feedback. It must not expose raw scores, hidden flags, server rules, or internal prompts.

The Game Backend may also send transcript-based feedback input:

```json
{
  "roomId": "room_001",
  "messages": [
    {
      "sender": "USER",
      "content": "오늘 좀 힘들었어.",
      "type": "NORMAL",
      "createdAt": "2026-06-30T00:00:00.000Z"
    }
  ]
}
```
