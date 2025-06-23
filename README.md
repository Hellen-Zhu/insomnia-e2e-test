# Insomnia E2E Test Framework

A comprehensive end-to-end testing framework built with Playwright for testing web applications.

## Features

- 🚀 **Fast and Reliable**: Built on Playwright for fast, reliable end-to-end testing
- 🌐 **Multi-browser Support**: Test across Chromium, Firefox, and WebKit
- 📊 **Rich Reporting**: HTML, JSON, and JUnit test reports
- 🎯 **Parallel Execution**: Run tests in parallel for faster execution
- 🔄 **Auto-retry**: Automatic retry for failed tests
- 📸 **Visual Debugging**: Screenshots and video recordings on failure
- 🐛 **Trace Viewer**: Detailed test traces for debugging

## Prerequisites

- Node.js (version 22 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:Hellen-Zhu/insomnia-e2e-test.git
   cd insomnia-e2e-test
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

## Project Structure

```
insomnia-e2e-test/
├── tests/                    # Test files
│   ├── e2e/                 # End-to-end tests
│   ├── fixtures/            # Test fixtures and data
│   └── utils/               # Test utilities and helpers
├── pages/                   # Page Object Models
├── playwright.config.js     # Playwright configuration
├── package.json            # Project dependencies
└── README.md              # This file
```

## Configuration

The framework is configured via `playwright.config.js` with the following features:

- **Multi-browser testing**: Chrome, Firefox, Safari
- **Parallel execution**: Configurable worker processes
- **Retry mechanism**: Automatic retry for failed tests
- **Rich reporting**: HTML, JSON, and JUnit reports
- **Visual debugging**: Screenshots and videos on failure

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in headed mode (with browser UI)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium


# Run specific test file
npx playwright test example.spec.js

# Run tests with specific tag
npx playwright test --grep "smoke"
```

### Debug Mode

```bash
# Run tests in debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test example.spec.js --debug
```

### CI/CD Commands

```bash
# Run tests in CI environment
npx playwright test --reporter=html

# Install browsers for CI
npx playwright install --with-deps
```

## Test Reports

After running tests, you can view reports:

```bash
# Open HTML report
npx playwright show-report

# View test results
npx playwright show-report test-results/
```

## Continuous Integration

The framework is configured for CI environments with:

- Reduced parallel workers for stability
- Automatic retry for failed tests
- JUnit report generation
- Browser installation with dependencies

