# Unit Test Writer

## Purpose
Create unit tests that validate core logic, validators, and state machines.

## When to Use
- Adding or changing pure logic, validators, or state transitions.

## Required Inputs / Context
- Target functions and expected behavior.

## Read First
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/business-rules.md`

## Workflow
1. Identify pure logic and edge cases.
2. Write tests for success and failure cases.
3. Assert canonical error codes and transitions.
4. Keep tests focused and deterministic.

## Dangerous Mistakes
- Shallow tests that do not assert behavior.
- Ignoring canonical error codes.

## Validation Expectations
- Ensure tests fail for invalid inputs and pass for valid ones.

## Escalation Conditions
- If logic is not pure and needs integration tests instead.

## Related Skills / References
- `implementation/integration-test-writer.md`
