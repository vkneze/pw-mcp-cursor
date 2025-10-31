## How to run tests

To run all tests locally: 
```npx playwright test```

To run specific test:
```npx playwright test homepage.spec.ts```

To run specific tests filtered by tag using grep: 
```npx playwright test --grep '@login'```

To run a test with a specific title, use the -g flag followed by the title of the test:
```npx playwright test -g "should load homepage successfully"```

To run last failed test:
```npx playwright test --last-failed```


## How to list tests

To list all tests:
```npx playwright test --list```

To list tests (without running them) filtered by tag using grep:
```npx playwright test --list --grep '@sanity'```


## How to open HTML report 
To open last HTML report run:
```npx playwright show-report```
