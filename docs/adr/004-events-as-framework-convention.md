---
status: accepted
date: 2026-07-10
context:
  - AdonisJS uses the class name as the routing key to listeners
  - Event classes are thin but serve as framework binding contracts
  - Replacing them with interfaces would break the emission mechanism
---

## Context

An architectural review proposed replacing the 5 Event classes (UserRegistered, ForgotPassword, etc.) with typed interfaces, arguing that they are empty data bags.

## Decision

Keep the Event classes as they are. They are not just data carriers — they serve as the binding contract between the dispatcher and the listeners via their class name.

### Rationale

1. **Framework binding** — `emit('user:registered', new UserRegistered(user))` uses the class as a routing key.
2. **Explicit typing** — each event carries its own type, allowing the compiler to verify the payload expected by the listener.
3. **No gain in removal** — an interface `{ user: User }` would not replace the role of the class in the framework lifecycle.

## Consequences

- Event classes remain thin — this is a framework artifact, not an opportunity for deepening.
- `BaseTokenListener` is already the substantial module that orchestrates the common flow; events are only typed triggers.
