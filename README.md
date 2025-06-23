# Insomnia E2E Test Framework

A comprehensive end-to-end testing framework built with Playwright for testing web applications, specifically designed for Insomnia API client testing.

## Features

- **Fast and Reliable**: Built on Playwright for fast, reliable end-to-end testing
- **Multi-browser Support**: Test across Chromium, Firefox, and WebKit
- **Rich Reporting**: HTML, JSON, and JUnit test reports
- **Parallel Execution**: Run tests in parallel for faster execution
- **Auto-retry**: Automatic retry for failed tests
- **Visual Debugging**: Screenshots and video recordings on failure
- **Trace Viewer**: Detailed test traces for debugging
- **Page Object Model**: Clean, maintainable test structure
- **GitHub Actions Integration**: Automated CI/CD with email notifications

## Best Practices

1. **Use Page Object Model**: Organize page interactions into reusable classes
2. **Write Descriptive Tests**: Use clear test names and descriptions
3. **Use Data Attributes**: Prefer `data-testid` over CSS selectors
4. **Handle Async Operations**: Always await page operations
5. **Add Meaningful Assertions**: Test behavior, not implementation
6. **Group Related Tests**: Use test.describe for organizing tests
7. **Use Tags**: Categorize tests with @smoke, @regression, etc.


## Limitations

### Authentication Testing Limitations

1. **Google/GitHub Login**: 
   - Only validates redirection to respective login interfaces
   - Cannot perform actual authentication due to OAuth limitations and security restrictions
   - Tests focus on UI navigation and redirect functionality

2. **SSO Login**: 
   - Demo implementation with simplified test cases
   - Limited to basic SSO flow demonstration
   - Not comprehensive for all SSO provider scenarios

3. **Email Verification**: 
   - Cannot test actual email verification due to third-party CAPTCHA and email verification code requirements
   - Limited to UI interaction testing without real email delivery validation
   - Human verification steps cannot be automated

## Prerequisites

- Node.js (version 22 or higher)
- npm or yarn package manager
- Git

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
├── .github/workflows/          # GitHub Actions workflows
│   └── playwright.yml         # CI/CD configuration
├── pages/                     # Page Object Models
│   ├── BasePage.js           # Base page class with common methods
│   ├── AuthPage.js           # Authentication page
│   ├── GitHubLoginPage.js    # GitHub login page
│   ├── GoogleLoginPage.js    # Google login page
│   ├── SSOLoginPage.js       # SSO login page
│   ├── EmailVerificationPage.js # Email verification page
│   └── index.js              # Page classes export
├── tests/                     # Test files
│   ├── e2e/                  # End-to-end tests
│   ├── fixtures/             # Test fixtures and data
│   └── utils/                # Test utilities and helpers
├── playwright.config.js      # Playwright configuration
├── package.json             # Project dependencies and scripts
└── README.md               # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests in specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Run tests by category
npm run test:smoke
npm run test:regression

# Run tests with specific options
npm run test:workers    # Single worker (serial execution)
npm run test:retries    # 3 retries for failed tests
npm run test:parallel   # 4 workers (parallel execution)

# Run specific test 
npx playwright test example.spec.js 
```

### Code Generation

```bash
# Generate test code interactively
npm run test:codegen

# Generate test code for specific URL
npx playwright codegen https://playwright.dev
```

## Test Reports

After running tests, you can view reports:

```bash
# Open HTML report
npm run test:report

# View test results
npx playwright show-report test-results/
```

## 📝 Writing Tests

### Basic Test Structure

```javascript
const { test, expect } = require('@playwright/test');

test('basic test', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  const title = await page.title();
  expect(title).toContain('Playwright');
});
```

## GitHub Actions CI/CD

### Automated Testing

The project includes GitHub Actions workflow that:

1. **Triggers on**: Push to main, Pull requests, Daily schedule, Manual dispatch
2. **Tests on**: Chromium and Firefox browsers
3. **Uploads**: Test reports and screenshots as artifacts
4. **Sends**: Email notifications for test results

### Manual Workflow Trigger

You can manually trigger the workflow:

1. Go to **Actions** tab in your repository
2. Select "Playwright Tests" workflow
3. Click "Re-run all jobs"

## Links

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Reports](https://playwright.dev/docs/test-reporters)