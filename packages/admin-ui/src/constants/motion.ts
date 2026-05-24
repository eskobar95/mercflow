/**
 * Shared motion constants — Emil Kowalski discipline.
 *
 * Rules:
 *   - Never `transition: all`. Enumerate specific properties.
 *   - Asymmetric open/close timing: open is deliberate, close is snappy.
 *   - GPU-composited properties only for sheet animations: transform + opacity.
 *   - Use these in `style` props, not arbitrary Tailwind values.
 */

/** iOS navigation drawer curve — used for slide-in panels and sheets. */
export const DRAWER_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"

/** Soft landing curve — used for elements entering from rest (cards, modals). */
export const ENTER_EASE = "cubic-bezier(0.23, 1, 0.32, 1)"

/** Sheet open timing (ms) — deliberate, weighted. */
export const SHEET_OPEN_MS = 280

/** Sheet close timing (ms) — snappy release. */
export const SHEET_CLOSE_MS = 200
