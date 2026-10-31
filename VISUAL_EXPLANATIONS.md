# Visual explanations

After a first incorrect answer, a picture-based hint is shown for supported skills. Show me how opens the full worked example without requiring another mistake. The worked example stays until Got it is tapped. Other skills retain their existing hints and explanations.

Models cover counting, place value and regrouping, comparisons, addition/subtraction through 100, missing-number equations, true/false equality, one- and two-step stories, clock hands, coin/bill totals, tally/pictograph calculations, flat shapes, equal shares, and ruler measurement. Subtraction crosses out counters; larger calculations show trades between one ten and ten ones. Number lines show direction and landings. Money models label denominations and running totals separately for cents and dollars. Color is accompanied by labels, grouping, and cross-out marks.

New generator metadata is used for the original counting/place-value/comparison tasks. Other models use the existing mathematical operands. Generated story solution equations provide each step's operands. Models do not depend on the chosen wrong answer.

Round length, saved profiles, adaptive scoring, and progress links remain supported. Assisted answers still do not count toward mastery. Models use inline HTML/SVG without external assets. Existing number-sequence, ordering, solid-shape and shape-composition tasks retain their original visual hints/explanations.

Validation: node tests/visual-explanations.test.cjs covers 13,950 generated questions, all themes and levels, explicit counter counts, borrowing, conservation of quantity during trades, hint/reveal flow, retained explanations, clearing the next question, and ordering fallback. The 55,800-question bank suite and progress-sharing suite also pass. Browser rendering was not rechecked in this environment; the earlier browser launch failed/stalled.
