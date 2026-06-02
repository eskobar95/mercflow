/**
 * CONDURO_CI_SMOKE — intentional semgrep target for Pi audit E2E.
 * Not imported anywhere. Pi should classify as advisory, not blocking.
 */
export function conduroCiSmokeEval(input) {
  // semgrep: javascript.lang.security.audit.eval-detected
  return eval(input);
}
