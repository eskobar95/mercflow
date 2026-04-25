# Walter Command Patterns — Batch Orchestration

Use these command patterns in Paperclip issue comments or as command/skill prompts for Walter. Keep them in English.

## 1. Start a new batch

Use on the batch orchestration issue after the spec/plan and initial sub-issues exist.

```text
Walter, orchestrate this batch.

Read this parent issue, its linked spec/plan, and all sub-issues. Validate the dependency graph, labels, assignees, reviewers, approvers, and `Blocked by` relationships.

Then comment with:
1. The recommended execution order.
2. Which issues are ready to start now.
3. Which issues are blocked and by what.
4. Any missing API contracts or handoffs.
5. Any decision that must go back to the human owner.

Do not write code. Do not change product scope.
```

## 2. Reconcile planted issues

Use when issues were created by MCP/UI and Walter needs to normalize them.

```text
Walter, reconcile the planted issues for this batch.

Find all sub-issues under this orchestration issue and all issues labeled `batch-N`. Ensure each issue has the correct parent, label, assignee, reviewer/approver where relevant, and `Blocked by` relationships.

If anything cannot be safely inferred, comment with a single clear question and label the issue `needs-human`.
```

## 3. Prepare Backend handoff

Use when a Backend issue is marked done or ready for Frontend.

```text
Walter, verify the Backend handoff.

Check that the Backend issue includes an `## API handoff` or `## API Contract` section with routes, request shape, response shape, validation notes, and edge cases.

If complete, comment on the dependent Frontend issue that it is ready to start and remove/resolve the relevant blocker if the workflow allows it.

If incomplete, ask Backend for the missing contract details and keep Frontend blocked.
```

## 4. Request review

Use when implementation issues are complete and need Reviewer.

```text
Walter, route this work to review.

Confirm the implementation issue has a PR link or clear completion evidence. Assign or notify Reviewer, add `ready-for-review`, and ensure the review issue is not blocked by missing implementation details.

Do not approve the work yourself. Reviewer produces the technical report.
```

## 5. Escalate to human

Use when Walter cannot decide safely.

```text
Walter, escalate this blocker to the human owner.

Summarize the decision needed in one short paragraph, list the concrete options if there are multiple, and recommend no more than one default path if the tradeoff is clear.

Add `needs-human`, assign back to the human owner or CEO, and do not unblock dependent issues until the decision is recorded.
```

## 6. Merge-readiness process check

Use after Reviewer passes and CI/PR evidence exists.

```text
Walter, perform a merge-readiness process check.

Check scope alignment, required handoffs, Reviewer report, CI status summary, migration documentation if applicable, and unresolved `needs-human` blockers.

If ready, comment:
Tech Lead: OK for merge from process/scope perspective.

If not ready, list the blocking issue(s) and the next owner.

Do not click merge or perform Git operations.
```

