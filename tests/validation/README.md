# ClickUp Offline Wiki Validation

This directory contains tools for validating that the ClickUp Offline Wiki correctly transforms and stores ClickUp documents. These tests help ensure the program meets the requirements for file system structure, link transformation, and content preservation.

The validation framework uses Vitest, the same testing framework used for the unit tests in the project.

## Validation Tests

The validation suite includes the following tests:

1. **Output Comparison Test**: Compares the actual output against expected output in `.clickup-compare`.
2. **Link Transformation Test**: Validates that different types of links are correctly transformed.
3. **Directory Structure Test**: Ensures the directory structure matches the expected hierarchy.

## Running the Tests

### Prerequisites

1. Ensure you have a `test-config.yml` file in the project root with a valid ClickUp API key.
2. Make sure all dependencies are installed: `npm install`
3. Build the project: `npm run build`

### Running All Validation Tests

To run the complete validation suite:

```bash
npm run validate
```

### Running Individual Tests

You can also run individual validation tests:

- Output Comparison Test: `npm run validate:output`
- Link Transformation Test: `npm run validate:links`
- Directory Structure Test: `npm run validate:structure`

## Expected Results Format

The expected output for comparison should be stored in the `.clickup-compare` directory. This directory should contain the expected file structure and content that would be produced when syncing a specific ClickUp document.

## Interpreting Test Results

The validation tests provide detailed output about:

- Missing files
- Extra files
- Content differences
- Link transformation correctness
- Directory structure compliance

## Adding New Test Cases

To add a new test case:

1. Create a reference output in `.clickup-compare-[test-name]`
2. Update the test scripts to use the new comparison directory
3. Run the validation tests

## Troubleshooting

Common issues:

- **API Key Errors**: Ensure your ClickUp API key is valid in `test-config.yml`
- **Missing Expected Output**: Make sure `.clickup-compare` directory exists and contains the expected output structure
- **TypeScript Errors**: Run `npm run build` to ensure all TypeScript files are compiled correctly
