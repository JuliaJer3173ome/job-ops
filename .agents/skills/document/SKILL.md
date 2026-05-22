# Document Skill

Automatically generate, improve, and maintain documentation for code, APIs, and project components.

## Overview

The `document` skill analyzes existing code and generates comprehensive, accurate documentation including JSDoc comments, README sections, API references, and inline explanations. It ensures documentation stays in sync with implementation.

## Capabilities

- Generate JSDoc/TSDoc comments for functions, classes, and interfaces
- Write or update README sections based on actual code behavior
- Create API reference documentation from TypeScript types and function signatures
- Add inline comments to complex logic
- Detect undocumented exports and flag them
- Sync documentation with code changes

## Usage

```
@agent document [target]
```

### Examples

```
@agent document src/utils/dateHelpers.ts
@agent document --api src/routes/
@agent document --readme
@agent document --inline src/core/scheduler.ts
```

## Parameters

| Flag | Description | Default |
|------|-------------|--------|
| `--api` | Generate API reference docs | false |
| `--readme` | Update README.md sections | false |
| `--inline` | Add inline comments to complex blocks | false |
| `--dry-run` | Preview changes without writing | false |
| `--style` | Doc style: `jsdoc`, `tsdoc`, `plain` | `tsdoc` |
| `--coverage` | Report documentation coverage | false |

## Behavior

### Function Documentation

For each exported function, the skill will:

1. Infer parameter types from TypeScript signatures
2. Detect thrown errors by analyzing `throw` statements
3. Identify return type and describe the return value semantically
4. Add `@example` blocks where usage patterns are clear
5. Flag deprecated patterns with `@deprecated`

### Class Documentation

For classes and interfaces:

1. Document the class-level purpose from constructor logic and method names
2. Document each public method and property
3. Note any design patterns in use (e.g., Singleton, Observer)
4. Link related types with `@see` references

### README Integration

When `--readme` is used:

1. Scans `package.json` for project metadata
2. Updates the **Installation**, **Usage**, and **API** sections
3. Preserves manually written sections (marked with `<!-- preserve -->` comment)
4. Appends a **Contributing** section if missing

## Output Format

### TSDoc Example

```typescript
/**
 * Formats a raw job listing object into a normalized `JobEntry` shape.
 *
 * Strips HTML from the description, normalizes salary ranges to a
 * consistent currency format, and resolves relative URLs to absolute.
 *
 * @param raw - The unprocessed job object from the external API
 * @param baseUrl - Base URL used to resolve relative links
 * @returns A normalized `JobEntry` ready for storage or display
 *
 * @throws {ValidationError} If required fields (`title`, `company`) are missing
 *
 * @example
 * ```ts
 * const entry = normalizeJob(apiResponse, 'https://jobs.example.com');
 * console.log(entry.salary.formatted); // "£40,000 – £55,000"
 * ```
 */
export function normalizeJob(raw: RawJob, baseUrl: string): JobEntry {
  // ...
}
```

## Documentation Coverage Report

When `--coverage` is used, outputs a summary:

```
Documentation Coverage Report
==============================
Files scanned:        24
Exported symbols:     87
Documented:           61  (70%)
Missing docs:         26  (30%)

Undocumented exports:
  src/utils/filters.ts        filterByLocation, filterBySalary
  src/api/jobsRouter.ts       handleSearch
  src/models/Application.ts   ApplicationStatus
```

## Integration with Other Skills

- **audit** — Run `audit` first to identify code quality issues before documenting
- **clarify** — Use `clarify` on ambiguous logic before the `document` skill attempts to describe it
- **critique** — After documenting, `critique` can verify docs match actual behavior

## Configuration

Add to `.agents/config.json`:

```json
{
  "skills": {
    "document": {
      "style": "tsdoc",
      "includeExamples": true,
      "minCoverageThreshold": 80,
      "ignorePatterns": ["**/*.test.ts", "**/__mocks__/**"]
    }
  }
}
```

## Limitations

- Cannot infer semantic meaning from single-letter variable names without context
- Does not document test files by default (configurable)
- Complex generic types may produce verbose but technically accurate descriptions
- Side effects that occur outside the function body (e.g., global state mutation) may not be detected automatically

## Notes

The `document` skill respects existing documentation. It will **not** overwrite manually written doc comments unless the `--force` flag is provided. When updating existing docs, it merges new parameter information while preserving custom descriptions.
