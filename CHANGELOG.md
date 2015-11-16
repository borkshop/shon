
# v2

Be aware of the following changes when migrating from v1:

- Positional arguments may be optional and may have defaults.
- Configuration objects now omit properties that would be null or undefined.
  So: `{}` instead of `{property: null}` or `{property: undefined}`.

Features:

- Adds support for JSON and JSHON (hybrid SHON/JSON) argument types.
- The usage parser is now checked into the project.
  This eliminates a rather slow compilation step from startup times.
- Furthermore, you can now precompile usage files to JSON for snappy startup
  times.

Fixes:

- SHON arguments can be optional.
- The cut demo now works for data events that subsume multiple lines of input.

