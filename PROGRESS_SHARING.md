# Share saved progress

Open a player, choose Grown-ups, then Share saved progress. Send the generated link to the other phone. The recipient previews the player names and save date, then chooses Load shared progress & play.

Links include all players’ names, themes, stars, stickers, statistics, difficulty levels and focus settings. They are snapshots, not live sync. Send a fresh link to transfer later progress. Matching player IDs are replaced only after the recipient presses Load; unrelated players stay. Device sound/voice preferences stay local. Unfinished rounds restart and recent-question history is not transferred.

The save is encoded in the URL fragment, with gzip compression when supported, and stored locally on the receiving phone. No accounts or backend database are required. The app clears the fragment after reading it so reloading does not reimport an older snapshot. Treat the link as personal: anyone receiving it can load the included player names and progress.

Validation: node tests/progress-sharing.test.cjs and node tests/first-grade-bank.test.cjs passed. The transfer tests cover compressed/plain links, multiple players, Unicode names, preview without writes, matching-player replacement, preserving unrelated players, snapshot isolation, malformed input, blocked storage, and copy-link fallback. Real-browser checks could not be completed because browser launch stalled in this environment.
