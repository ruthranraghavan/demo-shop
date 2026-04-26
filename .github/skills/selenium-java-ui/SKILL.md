---
name: selenium-java-ui
description: >
  Use this skill whenever the user wants to write, generate, debug, refactor, or review
  Selenium WebDriver automation code in Java. Triggers include: UI automation, browser
  automation, end-to-end (E2E) testing, web testing with Java, Selenium scripts, WebDriver
  setup, TestNG/JUnit test classes, Page Object Model (POM), XPath/CSS selectors, handling
  waits (implicit/explicit/fluent), ChromeDriver/GeckoDriver/EdgeDriver setup, running
  Selenium with Maven or Gradle, Selenium Grid, data-driven testing, screenshot capture,
  cross-browser testing, CI/CD pipeline integration, or any task that involves automating
  a browser using Java. Always use this skill even if the user just says "help me automate
  this website" or "write a test for this page" in Java context.
---

# Selenium WebDriver UI Automation — Java

This skill guides Claude to produce production-grade Selenium WebDriver automation code in
Java, following industry best practices: Page Object Model, robust waits, clean assertions,
and maintainable project structure.

---

## Core Principles

1. **Always use Page Object Model (POM)** — never put locators or interactions inside test methods.
2. **Never use `Thread.sleep()`** — always use `WebDriverWait` (explicit wait) or `FluentWait`.
3. **Use dependency injection** via a `DriverFactory` / `BaseTest` pattern for WebDriver lifecycle.
4. **Prefer CSS selectors** over XPath when both are equally readable; prefer `id` and `data-testid` above all.
5. **Use TestNG** (preferred for UI automation) or JUnit 5 — always confirm with user which one to use.
6. **All tests must be independent** — no shared state between test methods.
7. **Always add meaningful assertions** — never trust a test that can never fail.

---

## Project Structure

```
src/
├── main/java/
│   └── com.example.automation/
│       ├── pages/          ← Page Object classes
│       ├── components/     ← Reusable UI components (navbar, modal, etc.)
│       ├── utils/
│       │   ├── DriverFactory.java
│       │   ├── WaitUtils.java
│       │   └── ScreenshotUtil.java
│       └── config/
│           └── ConfigReader.java
└── test/java/
    └── com.example.tests/
        ├── BaseTest.java   ← @BeforeMethod/@AfterMethod driver init/teardown
        └── <Feature>Test.java
```

For Maven projects, always use this structure and remind the user to add `pom.xml` dependencies.
For Gradle projects, use `build.gradle` dependencies.  
→ See `references/dependencies.md` for exact dependency blocks.

---

## DriverFactory Pattern (always use this)

```java
public class DriverFactory {
    private static ThreadLocal<WebDriver> driver = new ThreadLocal<>();

    public static void initDriver(String browser) {
        WebDriver webDriver;
        switch (browser.toLowerCase()) {
            case "firefox":
                WebDriverManager.firefoxdriver().setup();
                webDriver = new FirefoxDriver();
                break;
            case "edge":
                WebDriverManager.edgedriver().setup();
                webDriver = new EdgeDriver();
                break;
            default:
                WebDriverManager.chromedriver().setup();
                ChromeOptions options = new ChromeOptions();
                options.addArguments("--start-maximized");
                // options.addArguments("--headless=new"); // uncomment for CI
                webDriver = new ChromeDriver(options);
        }
        driver.set(webDriver);
    }

    public static WebDriver getDriver() {
        return driver.get();
    }

    public static void quitDriver() {
        if (driver.get() != null) {
            driver.get().quit();
            driver.remove();
        }
    }
}
```

**Key points:**
- `ThreadLocal<WebDriver>` enables parallel test execution safely.
- Always use `WebDriverManager` (io.github.bonigarcia) — no manual driver binary management.
- Browser name should come from a config file or system property, not hardcoded.

---

## BaseTest Pattern

```java
@Listeners(TestListener.class)
public class BaseTest {
    
    @BeforeMethod
    public void setUp() {
        String browser = System.getProperty("browser", ConfigReader.get("browser"));
        DriverFactory.initDriver(browser);
        DriverFactory.getDriver().get(ConfigReader.get("base.url"));
    }

    @AfterMethod
    public void tearDown(ITestResult result) {
        if (ITestResult.FAILURE == result.getStatus()) {
            ScreenshotUtil.capture(result.getName());
        }
        DriverFactory.quitDriver();
    }

    protected WebDriver driver() {
        return DriverFactory.getDriver();
    }
}
```

---

## Page Object Model

```java
public class LoginPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    // Locators — private, final, near the top of the class
    private final By usernameField = By.id("username");
    private final By passwordField = By.id("password");
    private final By loginButton   = By.cssSelector("button[type='submit']");
    private final By errorMessage  = By.cssSelector(".error-message");

    public LoginPage(WebDriver driver) {
        this.driver = driver;
        this.wait   = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this); // optional if using @FindBy
    }

    public LoginPage enterUsername(String username) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(usernameField))
            .clear();
        driver.findElement(usernameField).sendKeys(username);
        return this;  // fluent interface for chaining
    }

    public LoginPage enterPassword(String password) {
        driver.findElement(passwordField).sendKeys(password);
        return this;
    }

    public DashboardPage clickLogin() {
        wait.until(ExpectedConditions.elementToBeClickable(loginButton)).click();
        return new DashboardPage(driver);
    }

    public String getErrorMessage() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(errorMessage))
                   .getText();
    }
}
```

**Rules for Page Objects:**
- One class per page/significant component.
- Methods return `this` (same page) or a new Page Object (for navigation).
- No assertions inside page objects — only in test classes.
- Group locators at the top; always `private final`.

---

## Wait Strategy

| Scenario | Wait Type | Code |
|---|---|---|
| Element visible | Explicit | `wait.until(ExpectedConditions.visibilityOfElementLocated(by))` |
| Element clickable | Explicit | `wait.until(ExpectedConditions.elementToBeClickable(by))` |
| Text present | Explicit | `wait.until(ExpectedConditions.textToBePresentInElementLocated(by, text))` |
| AJAX / dynamic | Fluent | See `references/advanced-patterns.md` → FluentWait section |
| Page load | N/A | `driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30))` |
| ❌ NEVER | Hardcoded | `Thread.sleep(3000)` — BANNED |

**Global timeout config (put in BaseTest setUp):**
```java
driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(0)); // keep at 0 when using explicit
driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(30));
```

---

## Test Class Pattern

```java
public class LoginTest extends BaseTest {

    @Test(description = "Successful login with valid credentials")
    public void shouldLoginWithValidCredentials() {
        LoginPage loginPage = new LoginPage(driver());
        DashboardPage dashboard = loginPage
            .enterUsername("user@example.com")
            .enterPassword("securePass123")
            .clickLogin();

        Assert.assertTrue(dashboard.isLoaded(), "Dashboard should be loaded after login");
        Assert.assertEquals(dashboard.getWelcomeMessage(), "Welcome, User");
    }

    @Test(description = "Login fails with invalid password")
    public void shouldShowErrorOnInvalidPassword() {
        LoginPage loginPage = new LoginPage(driver());
        loginPage.enterUsername("user@example.com")
                 .enterPassword("wrongPassword")
                 .clickLogin();   // returns LoginPage since we stayed on it

        String error = loginPage.getErrorMessage();
        Assert.assertEquals(error, "Invalid credentials. Please try again.");
    }

    @Test(dataProvider = "loginData", description = "Data-driven login scenarios")
    public void shouldValidateLoginScenarios(String username, String password, String expected) {
        LoginPage loginPage = new LoginPage(driver());
        // ... use parameters
    }

    @DataProvider(name = "loginData")
    public Object[][] loginData() {
        return new Object[][]{
            {"valid@user.com",   "pass123",   "success"},
            {"",                 "pass123",   "Username is required"},
            {"invalid@user.com", "wrongPass", "Invalid credentials"},
        };
    }
}
```

---

## Common Interactions — Quick Reference

```java
// Dropdown (HTML <select>)
Select dropdown = new Select(driver.findElement(By.id("country")));
dropdown.selectByVisibleText("India");
dropdown.selectByValue("IN");
dropdown.selectByIndex(2);

// Checkbox & Radio
WebElement checkbox = driver.findElement(By.id("agree"));
if (!checkbox.isSelected()) checkbox.click();

// Alert handling
Alert alert = wait.until(ExpectedConditions.alertIsPresent());
alert.accept();   // OK
alert.dismiss();  // Cancel
String alertText = alert.getText();

// File upload
driver.findElement(By.id("fileInput")).sendKeys("/absolute/path/to/file.pdf");

// Hover (Actions API)
Actions actions = new Actions(driver);
actions.moveToElement(driver.findElement(By.id("menu"))).perform();

// Drag and Drop
actions.dragAndDrop(sourceElement, targetElement).perform();

// Scroll to element
((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", element);

// Click via JavaScript (for stubborn elements)
((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);

// Switch to iframe
driver.switchTo().frame("iframeName");
driver.switchTo().defaultContent();

// Switch to new window/tab
String original = driver.getWindowHandle();
for (String handle : driver.getWindowHandles()) {
    if (!handle.equals(original)) driver.switchTo().window(handle);
}
```

---

## Selector Priority (best → worst)

1. `By.id("submit-btn")` — fastest, most stable
2. `By.cssSelector("[data-testid='submit']")` — great for React/Vue apps
3. `By.name("email")` — for form fields
4. `By.cssSelector(".card > .title")` — short, structural CSS
5. `By.linkText("Sign In")` — for anchor tags
6. `By.xpath("//button[@type='submit']")` — use only when CSS can't express it
7. ❌ `By.xpath("/html/body/div[3]/form/button")` — never use absolute XPath

---

## When to Read Reference Files

| Topic | File |
|---|---|
| Maven/Gradle dependencies, `pom.xml` / `build.gradle` snippets | `references/dependencies.md` |
| Selenium Grid, RemoteWebDriver, Docker setup | `references/advanced-patterns.md` |
| Extent Reports, Allure reporting setup | `references/reporting.md` |
| CI/CD integration (GitHub Actions, Jenkins, GitLab CI) | `references/cicd.md` |
| TestNG `testng.xml`, parallel execution config | `references/testng-config.md` |

---

## Output Checklist (before presenting code)

- [ ] Page Object class created for every page involved
- [ ] No `Thread.sleep()` anywhere
- [ ] `WebDriverWait` used for all element interactions
- [ ] `DriverFactory` with `ThreadLocal<WebDriver>` used
- [ ] `BaseTest` handles `@BeforeMethod` / `@AfterMethod`
- [ ] Test methods are independent (no shared mutable state)
- [ ] Meaningful `Assert` statements with failure messages
- [ ] Locators use `By.*` fields (not inline strings)
- [ ] `pom.xml` / `build.gradle` dependencies mentioned or included
- [ ] Package structure follows convention (`pages/`, `utils/`, `config/`)