# Liquid Glass Suite evals

Ten benchmark prompts test skill selection and observable task behavior. They are not unit tests and have no pre-filled outcomes.

## Run against any agent

1. Install the complete suite in a clean agent environment. Keep `skills/`, `shared/` and the plugin manifests together; do not give the agent extra implementation hints.
2. Start a fresh session for each prompt. Paste only that file's **User prompt**, then save the full transcript and any patch or command output.
3. Record which skill fired. A wrong expected skill is a selection failure even if the answer looks plausible; if the agent supports explicit skill invocation, log whether selection was automatic or manual.
4. Have an evaluator check every **Expected behavior** bullet as `pass`, `fail`, or `not observable`. Count an assertion only when the transcript/artifact contains evidence for it. Do not infer browser, device, build or visual passes from prose.
5. Record suite commit, agent/model, date, environment, prompt file and evidence location in the results table. Repeat runs rather than overwriting a failure with a later pass.

Suggested scorecard: `selection = correct triggers / 10`; `behavior = satisfied assertions / total observable assertions`. Report unobservable assertions separately instead of treating them as passes. Keep failing transcripts as regression fixtures.

## Results

No runs are recorded here.

| Date | Suite commit | Agent/model | Prompt | Expected skill | Actual skill | Assertions passed / observable | Result | Evidence |
|---|---|---|---|---|---|---|---|---|

The suite's executable verification is separate: run `python -m unittest discover -s tests -v`, `node scripts/build-showcase.mjs --check`, and `npm test` when Playwright browsers are available.
