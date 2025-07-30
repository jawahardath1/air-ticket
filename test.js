const { chromium } = require("playwright");  // chromium Or 'firefox' or 'webkit'.
const prompt = require('prompt-sync')();

async function getInput(promptText, validOptions) {
    let input;
    while (true) {
        input = prompt(promptText);
        if (!validOptions || validOptions.includes(input)) {
            break;
        } else {
            console.log("Invalid input, please try again.");
        }
    }
    return input;
}

async function getCreditCardInfo(cardType) {
    const cardNumber = await getInput(`Enter your ${cardType} credit card number (16 digits): `, (input) => /^\d{16}$/.test(input));
    const expDate = await getInput(`Enter ${cardType} expiration date (MMYY): `, (input) => /^\d{4}$/.test(input));
    const secureCode = await getInput(`Enter your ${cardType} secure code (3 digits): `, (input) => /^\d{3}$/.test(input));
    return { cardNumber, expDate, secureCode };
}

async function handleOverlay(page) {
    let overlayWasPresent = false;
    while (true) {
        const overlayStyle = await page.locator('#sec-overlay').getAttribute('style');
        if (overlayStyle === 'display: block;') {
            overlayWasPresent = true;
        } else {
            return overlayWasPresent && overlayStyle !== 'display: block;';
        }
        await page.waitForTimeout(100);
    }
}

async function navigateAndSearchForFlights(page) {
    await Promise.race([
        page.waitForSelector('li[class="flight-n__item ng-star-inserted"]'),
        page.waitForSelector('.alert'),
        page.waitForSelector('table[class="flexible-calendar__table"]'),
        page.waitForSelector('#sec-overlay[style="display: block;"]')
    ]);

    const overlayDisappeared = await handleOverlay(page);
    if (overlayDisappeared) {
        console.log("Detected overlay. It has now disappeared. Reloading page...");
        await page.reload();
        await page.waitForLoadState('load');
        return navigateAndSearchForFlights(page);
    }

    if (page.url() === 'https://www.koreanair.com/booking/search' || page.url() === 'https://www.koreanair.com/booking/calendar-fare-bonus') {
        console.log("No flights available, retrying...");
        await page.reload();
        await page.waitForLoadState('load');
        return navigateAndSearchForFlights(page);
    }
}

(async () => {
    const userId = await getInput("Enter User Id: ");
    const password = await getInput("Enter Password: ");
    const destination = await getInput("Enter your destination (ICN or JFK): ", ["ICN", "JFK"]);
    const desiredTime = await getInput(`Enter the departure time of your flight (If destination is ${destination} -> appropriate times): `, destination === "ICN" ? ["00:50", "13:30"] : ["10:00", "19:30"]);
    const desiredClass = await getInput("Select Prestige/Economy Class (1 -> Prestige, 2 -> Economy): ", ["1", "2"]);
    const desiredDates = await getInput("Select automatically or manually search (1 -> Automatically, 2 -> Manually): ", ["1", "2"]);
    const skypassOrVisa = await getInput("Skypass or Visa (skypass or visa): ", ["skypass", "visa"]);
    const visaInfo = await getCreditCardInfo("REGULAR VISA");

    const skypassInfo = skypassOrVisa === 'skypass' ? await getCreditCardInfo("Skypass Visa") : null;
    const testOrProd = await getInput("Test or Production (test or production): ", ["test", "production"]);

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.setDefaultTimeout(1000000000);

    // Block unnecessary resources
    await page.route('**/*.{png,jpg,jpeg}', (route) => route.abort());
    await page.route(/(analytics|fonts)/, (route) => route.abort());

    console.log("Logging in...");
    await page.goto("https://www.koreanair.com/login");
    await page.fill('input[type="text"]', userId);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("https://www.koreanair.com/");
    
    await page.click('button[id="tabBonusTrip"]');
    await page.click('label:has-text("One Way")');

    // Destination selection logic
    await selectDestination(page, destination);

    console.log("\nPlease enter departure date and click search.");
    if (desiredDates === '1') {
        await autoSelectDate(page);
    }

    await navigateAndSearchForFlights(page);

    while (true) {
        if (await selectFlight(page, desiredTime, desiredClass)) {
            await page.click('.payment-widget__confirm');
            break;
        }
        console.log("Sold out, refreshing Trying again.");
        await page.reload();
        await page.waitForLoadState('load');
    }

    await page.waitForURL("https://www.koreanair.com/payment/gate/RT/NR");

    await completePayment(page, skypassOrVisa, skypassInfo, visaInfo, testOrProd);

    console.timeEnd("Script Duration");
    await browser.close();
})();

async function selectDestination(page, destination) {
    if (destination === "ICN") {
        await page.click('button[class="quickbookings__location _has-dialog -to -off ng-star-inserted -oneway"]');
        await page.click('button[class="search-airport__local"]');
        await page.locator('button.local__button').filter({ hasText: 'Seoul/Incheon' }).click();
    } else {
        await page.click('button[class="quickbookings__location _has-dialog -from ng-star-inserted"]');
        await page.click('button[class="search-airport__local"]');
        await page.locator('button.local__button').filter({ hasText: 'Seoul/Incheon' }).click();
        await page.click('button[class="quickbookings__location _has-dialog -to -off ng-star-inserted -oneway"]');
        await page.click('button[class="search-airport__local"]');
        await page.locator('button.local__button').filter({ hasText: 'New York/John F. Kennedy, NY' }).click();
    }
}

async function autoSelectDate(page) {
    await page.click('button[class="quickbookings__datepicker"]');
    for (let i = 0; i < 6; i++) {
        await page.click('button[class="datepicker__next ng-tns-c42-2"]');
    }
    await page.waitForSelector('.datepicker__td.-available');
    await page.evaluate(() => {
        const lastAvailableElement = document.querySelectorAll('tr .datepicker__td.-available').pop();
        if (lastAvailableElement) {
            lastAvailableElement.click();
        }
    });
    await page.click('button[class="booking-widget__find"]');
}

async function selectFlight(page, desiredTime, desiredClass) {
    const flightBonusClass = desiredClass === '1' ? "01" : "00";
    const alternativeFlightBonusClass = desiredClass === '1' ? "11" : "10";
    const isFlightAvailable = await checkFlightAvailability(page, flightBonusClass, desiredTime);

    if (isFlightAvailable) {
        await page.click(`label[for="flight-bonus${flightBonusClass}"]`);
        return true;
    } else {
        return await checkFlightAvailability(page, alternativeFlightBonusClass, desiredTime);
    }
}

async function checkFlightAvailability(page, flightBonusClass, desiredTime) {
    const isSoldOut = await page.$eval(`label[for="flight-bonus${flightBonusClass}"]`, (element) => {
        return element.textContent.includes('Sold Out');
    });
    return !isSoldOut;
}

async function completePayment(page, skypassOrVisa, skypassInfo, visaInfo, testOrProd) {
    await page.click('#submit-passenger-ADT-0');
    await page.click('button[class="option -ghost"]');
    await page.waitForSelector('select[class="ng-pristine ng-valid ng-touched"]');

    // Select Timezone
    const timezoneSelectElement = await page.locator('select[class="ng-pristine ng-valid ng-touched"]');
    await timezoneSelectElement.selectOption('4: ATL');

    await page.click('button.confirm[type="submit"]');
    await page.click('#submit-contact');
    await page.click('button[id="btn-resv-agree-1"]');
    for (let i = 0; i < 2; i++) {
        await page.click('button[id="btnScrollDown"]');
    }
    await page.click('button[id="btnConfirm"]');

    const paymentMethodLocator = skypassOrVisa === "skypass" ? 'span[class="payment-method__icon -skypass-visa"]' : 'label[for="rad-cbsc"]';
    await page.click(paymentMethodLocator);

    if (skypassOrVisa === "skypass") {
        await page.fill('input[formcontrolname="cardNumber"][id="ipt-cardNumber"]', skypassInfo.cardNumber);
        await page.fill('input[formcontrolname="expirationDate"][id="ipt-expirationDate"]', skypassInfo.expDate);
        await page.fill('input[formcontrolname="verificationCode"][id="ipt-verificationCode"]', skypassInfo.secureCode);
    } else {
        await page.fill('input[formcontrolname="expirationDate"][id="ipt-expirationDate"]', visaInfo.expDate);
        await page.fill('input[formcontrolname="verificationCode"][id="ipt-verificationCode"]', visaInfo.secureCode);
        await page.click('label[for="chk-cbsc-save-card-info"]');
    }

    if (testOrProd === "production") {
        await page.click('button[id="btn-payment"]');
    }
}
