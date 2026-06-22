# Backlog

Task files follow the naming convention `TASK-<NNN>-<slug>.md`.
NNN is a zero-padded integer that never gets reused, even after a task is archived.

## Status lifecycle

```
Status: todo → in-progress → done → archived to backlog/done/
```

## Task file header format (parsed by /tdd)

```
## [TASK-NNN] Title

**Effort:** S | M | L
**Risk:** low | medium | high
**Status:** todo | in-progress | done
**Depends on:** TASK-NNN, TASK-NNN | —
```

## Directories

- `tasks/` — active tasks
- `done/` — archived completed tasks (moved here by `/tdd` on completion)
