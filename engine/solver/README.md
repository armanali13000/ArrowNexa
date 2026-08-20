# Solver Notes

ArrowNexa's current Phase 4 mechanic is monotonic: removing an arrow only decreases board occupancy.
That means a clear escape route cannot become blocked by a later move. In a solvable state, any valid
move preserves solvability under the current rules.

The solver still keeps recursive search, memoization, and state limits because future mechanics may add
special blockers, moving obstacles, or non-monotonic effects.
