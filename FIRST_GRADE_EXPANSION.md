# First-grade question-bank expansion

The first-grade app now has 31 skill generators across 10 activities. Every round, including Daily Showdown and focus areas, has 10 questions. The five existing adventure themes and saved player profiles remain supported.

## New activities and skills

- Money Market: coin values, how many coins make a dollar, penny/nickel/dime totals through 100 cents, and 1/5/10-dollar bill totals through 100 dollars. Coins and dollar bills are practiced separately, without decimal notation.
- Measuring Workshop: read rulers marked in inches or centimeters; compare and order the lengths of two or three objects.
- Data Discovery: count tally groups and interpret single-unit pictographs, including totals and comparisons.
- Existing activities gain number names/expanded form, different tens-and-ones decompositions, two-digit plus/minus one-digit calculations, zero facts, doubles, making ten, varied unknown positions, solid shapes, and shape composition.
- Clock questions mix analog-to-digital, digital-to-analog, spoken-time forms, and hour/half-hour understanding. Level 3 remains within first-grade hours and half-hours.
- Geometry has rotated flat shapes and solid shapes. Halves/fourths use more layouts and whole/part comparisons.
- Beginner stories now start with one step. More advanced stories stay within 20.

## Repetition and progression

Question selection balances the skills within each activity. Each profile remembers up to 120 recent question fingerprints; selection tries to avoid repeats within a round and across recent rounds. Small finite pools may still repeat when needed.

A skill rises after at least six attempts at its current level and four consecutive unassisted first-try correct answers. Two consecutive first-try errors lower it. Assisted successes do not count toward promotion. Retries on one question count as one independent attempt.

Existing names, themes, stars, stickers, levels, and accuracy are retained. New practice-history fields are initialized automatically. Parent progress reset also clears the added fields.

## Verification

Run `node tests/first-grade-bank.test.cjs`. The suite uses a DOM adapter and independently checks 55,800 generated questions across 31 generators, three levels, and five themes. It also checks stage/theme compatibility, ten-question rounds, balanced selection, recent-question memory, profile migration, mastery thresholds, hints, retries, clock answer reveals, and reset behavior.

Real-browser visual and accessibility testing was unavailable during this update because the coding environment failed to start and no browser-control tool was callable. These automated checks verify program behavior, not actual browser layout.

## Curriculum reference

Original practice content follows the relevant Florida first-grade topics in [Florida's B.E.S.T. mathematics course standards, effective August 2025](https://web02.fldoe.org/rules/Uploads/mathematics2025%206A-1.09412.pdf). It is a practice companion rather than a complete classroom course. Physical coins, rulers, shape manipulatives, drawing, and discussion remain useful alongside the game.
