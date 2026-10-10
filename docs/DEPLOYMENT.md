# Existing private Site deployment handoff

**Do not create a new Site or change its audience.**

- Project: `appgprj_6a58dec21bb48191a117789ebe708935`
- Existing URL: `https://rent-buy-invest.swaeli.chatgpt.site`
- Last verified saved version: **3**
- Verified access: current user is owner; custom allowlist contains only the owner; no groups, editors or external visitors.
- Hosting configuration: `.openai/hosting.json`, static directory `dist`.

The development environment contains the new empty PersonalFinance Git checkout and working native Sites connectors, but **does not contain `site-workflow.mjs` or the Sites helper bundle**. A filesystem search including `.agents`, `.codex`, `/opt` and the broader environment found no helper. Reading the cloud Sites skill succeeds; reading its script as a skill resource does not. Therefore the implementation was built and tested locally without replacing the current hosted version. No credentials are saved in source or artifacts.

## Supported completion procedure for the parent

1. Read the available Sites skill and install/materialize its trusted helper bundle in the execution environment. Re-read `get_site` for the exact project above; preserve owner-only access and retained history.
2. Call `create_source_repository_write_credential` for that project. Keep the credential in session memory only.
3. In a separate empty staging directory, launch the supported source helper:

   ```text
   node <plugin-root>/scripts/site-workflow.mjs --project-id appgprj_6a58dec21bb48191a117789ebe708935
   ```

   Use a TTY. Wait for the helper's hidden-stdin ready message, then send one newline-terminated JSON object containing `{ "credential": <returned credential object> }`. Omit `archivePath` for this opening step. Retain the complete returned result and use its `checkout_path`.
4. Preserve the opened checkout's `.git`, Site manifest identity, history and any required hosting configuration. Replace the old **application source** with this repository's clean tracked application files. Do not copy the PersonalFinance `.git` directory or private fixtures, and do not purge old commits/versions. Reconcile any extra existing hosting manifest fields instead of silently dropping them. The original empty PersonalFinance checkout is a separate user-selected source repository; retain it.
5. Run `npm test` and `npm run build` in the source checkout. If the helper's framework build profile requires `build-site.mjs`, configure the project for this static build using the skill's supported profile. No runtime dependencies are required. `dist/` must contain `index.html`, `style.css`, `app.js`, `model.js`, `history.js`, and `history-data.json`.
6. Launch the same source helper again. Supply the same credential (renew if expired), the **complete opening result as `source`**, remaining checks/builds as ordered argument arrays if needed, and an absolute `archivePath`. If the unchanged source already passed all checks/builds, use `commands: []`. The helper owns commit/push/packaging. Preserve its returned `project_id`, `commit_sha`, and unchanged `archive`.
7. Call `save_version_and_deploy_private` using those exact helper-returned fields. Do not substitute the PersonalFinance Git commit for a different Sites-source commit. For an error with `saved_version_id`, resume deployment of that version instead of saving twice.
8. Poll `get_deployment_status` only while pending/building/publishing. Report deployment as successful only on a terminal successful result with its literal URL. Record the saved version and verify that access is still owner-private if any access uncertainty arises.

The portable built archive is a handoff aid, not evidence of a pushed Sites commit or successful deployment. Build output must match the source SHA ultimately returned by the supported workflow. A parent with only the archive still needs the source sync/provenance step.

## Git review

PersonalFinance began with no commits or base branch, so there is no existing base against which to open a meaningful draft PR. The finished source can be reviewed as its initial commit. No merge is authorized or performed. If a base branch is established later, open a draft PR for subsequent review; do not merge without approval.
