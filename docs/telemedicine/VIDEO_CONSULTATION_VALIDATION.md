# ASRTAVA — WebRTC Video Consultation Architecture & Session Security

## 1. WebRTC Communication Architecture
ASRTAVA implements real-time audio and video consultations utilizing an abstracted WebRTC architecture. The system avoids third-party vendor lock-in by providing a pluggable adapter interface:

```
[Patient Web / Mobile]              [Doctor Web Client]
          │                                  │
          ├─── (1) Signaling & Auth Token ───┤
          │                                  │
          ▼                                  ▼
    [ASRTAVA API Gateway] ◄────────► [Signaling Engine]
          │                                  │
          ├──────────────────────────────────┤
          │                                  │
          ▼                                  ▼
    [WebRTC Media Router (SFU / LiveKit / Jitsi / P2P Mesh)]
```

---

## 2. Session Security Controls
1. **Short-Lived Ephemeral Tokens**: Consultation tokens are signed using HMAC-SHA256 with a 60-minute time-to-live (TTL). Reusing expired tokens is prevented.
2. **Distinct Role Payloads**: Patient tokens cannot be used to execute doctor clinical actions; doctor tokens authenticate clinician privilege.
3. **No Default Recording**: Consultations are **not recorded by default**. If recording is enabled by hospital policy, both patient and doctor must sign explicit recording consents.
4. **Media Encryption**: WebRTC streams enforce DTLS-SRTP encryption end-to-end between peer clients and SFU media nodes.

