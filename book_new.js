const {chromium} = require("playwright")
const prompt = require('prompt-sync')();


const userId = prompt("Enter User Id: ");
const password = prompt("Enter Password: ");
let destination = prompt("Enter your destination (ICN or JFK): ");
while (true) {
    if (destination === 'JFK' || destination === "ICN") {
        break;
    } else {
        destination = prompt("Invalid input, please enter your destination (JFK or ICN): ");
    }
}

console.log("\nEnter the departure time of your flight");
let desiredTime = prompt("(If destination is ICN -> 00:50 or 13:30.  If destination is JFK -> 10:00 or 19:30): ")
while (true) {
    if ((destination === "ICN" && (desiredTime === "00:50" || desiredTime === "13:30")) || (destination === "JFK" && (desiredTime === "10:00" || desiredTime === "19:30"))) {
        break;
    } else {
        desiredTime = prompt("Invalid departure time, please try again: ");
    }
}

console.log("\nEnter the desried class of your flight");
let desiredClass = prompt("Select Prestige/Economy Class, please enter (1 -> Prestige 2-> Economy): ");
while (true) {
    if(desiredClass === '1' || desiredClass === '2') {
        break;
    } else {
        desiredClass = prompt("Invalid input, please enter your desired class (1 -> Prestige 2-> Economy)");
    }
}

console.log("\n")
let skypassOrVisa = prompt("Skypass or Visa (skypass or visa): ");
while (true) {
    if (skypassOrVisa === 'skypass' || skypassOrVisa === "visa") {
        break;
    } else {
        skypassOrVisa = prompt("Invalid input, please enter your desired payment (skypass or visa): ");
    }
}
let skypassCCInfo;
let skypassExpDate;
let skypassSecureCode;
if (skypassOrVisa === 'skypass') {
    skypassCCInfo = prompt("Enter your skypass visa credit card number (16 digits): ");
    while (true) {
        if (isValidCreditCardFormat(skypassCCInfo)) {
            break;
        } else {
            skypassCCInfo = prompt("Incorrect format, try again: ");
        }
    }
    skypassExpDate = prompt("Enter expiration date (i.e. 0123): ");
    while (true) {
        if (/^\d{4}$/.test(skypassExpDate)) {
            break;
        } else {
            skypassExpDate = prompt("Incorrect format, try again: ");
        }
    }
    skypassSecureCode = prompt("Enter your secure code (i.e. 123): ");
    while (true) {
        if (/^\d{3}$/.test(skypassSecureCode)) {
            break;
        } else {
            skypassSecureCode = prompt("Incorrect format, try again: ");
        }
    }
}

console.log("\nIf skypass is unavailable, payment will fill in visa info");
let visaExpDate = prompt("Enter your REGULAR VISA expiration date (i.e. 0123): ");
while (true) {
    if (/^\d{4}$/.test(visaExpDate)) {
        break;
    } else {
        visaExpDate = prompt("Incorrect format, try again: ");
    }
}
let visaSecureCode = prompt("Enter your REGULAR VISA secure code (i.e. 123): ");
while (true) {
    if (/^\d{3}$/.test(visaSecureCode)) {
        break;
    } else {
        visaSecureCode = prompt("Incorrect format, try again: ");
    }
}

let testOrProd;
while (true) {
    console.log("\n")
    testOrProd = prompt("Test or Production (test or production): ");
    if (testOrProd === 'test' || testOrProd === "production") {
        let confirm = prompt("Are you sure? (yes or no): ");
        if (confirm === 'yes') {
            break;
        }
    } else {
        console.log("Invalid input, try again: ");
    }
}




;(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.setDefaultTimeout(1000000000)

    await page.route(
        '**/*.{png,jpg,jpeg}',
        (route) => route.abort()
    );

    await page.route(
        /(analytics|fonts)/,
        (route) => route.abort()
    );

    console.log("Logging in, please wait (processing request is normal).  If the software is stuck logging in please manually log in")

    await page.goto("https://www.koreanair.com/login");
    await page.fill('input[type="text"]', userId);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    setTimeout(function () {
        page.click('button[type="submit"]');
    }, 31000);

    await page.waitForURL("https://www.koreanair.com/");
    await page.click('button[id="tabBonusTrip"]');
    await page.click('label:has-text("One Way")');
    if (destination === "ICN") {
		console.log("\nICN");
        //await page.click('button[class="ng-star-inserted quickbookings__location _has-dialog -to -off -oneway"]');
        //await page.click('button[class="search-airport__local"]');
        //await page.click('button.local__button:has-text("Seoul/Incheon")');

        await page.click('button[class="quickbookings__location _has-dialog -to -off ng-star-inserted -oneway"]');
        await page.click('button[class="search-airport__local"]');
        await page.locator('button.local__button').filter({ hasText: 'Seoul/Incheon' }).click();
    } else {
		console.log("\nJFK ??");
        // await page.click('button[class="ng-star-inserted quickbookings__location _has-dialog -to -off -oneway"]');
        // await page.click('button[class="search-airport__local"]');
        // //await page.click('button.local__button:has-text("Seoul/Incheon")');
        // await page.locator('button.local__button').filter({ hasText: 'Seoul/Incheon' }).click();
        // await page.click('button[class="quickbookings__swap ng-star-inserted"]')

        await page.click('button[class="quickbookings__location _has-dialog -from ng-star-inserted"]');
        await page.click('button[class="search-airport__local"]');
        await page.locator('button.local__button').filter({ hasText: 'Seoul/Incheon' }).click();

        await page.click('button[class="quickbookings__location _has-dialog -to -off ng-star-inserted -oneway"]');
        await page.click('button[class="search-airport__local"]');
        await page.click('button[id="tab-local-1"]');
        await page.locator('button.local__button').filter({ hasText: 'New York/John F. Kennedy, NY' }).click();
    }


    console.log("\nPlease enter departure date and click search");
    console.log("Click the search button seconds (or on the dot) before the release time");
    console.log("After that you do not need to do anything, please monitor the script in case it gets stuck");
    console.log("If processing request popup appears, wait till it disappears and manually refresh")

    await page.click('button[class="quickbookings__datepicker"]');
    console.log("date Picker clicked");
    
    for(let i=1; i<=6; i++) {
        await page.click('button[class="datepicker__next ng-tns-c42-2"]');
        console.log("selected date: ", i);
    }
    console.log("out of the loop");

    // await page.waitForSelector('#month202508 table tbody');
    // for(let )

    // await page.locator('id="month202508"').click();
   // await page.click('button[class="ng-tns-c42-2 datepicker__td -available ng-star-inserted"]')
    console.log("clicked anonymous date");
    // await page.click('button[id="20250522"]');
    // console.log("selected date");

    await page.waitForURL("https://www.koreanair.com/booking/select-award-flight/departure");

    console.log("Looking for flights");
    console.time("Script Duration")

    await navigateAndSearchForFlights(page);

    //click on flight
    console.log("Clicking on desired flight if available")
    while (true) {

        if(desiredClass === '1') {
            await Promise.race([
                page.waitForSelector('label[for="flight-bonus01"]'),
                page.waitForSelector('#sec-overlay[style="display: block;"]')
            ])
        }

        if(desiredClass === '2') {
            await Promise.race([
                page.waitForSelector('label[for="flight-bonus00"]'),
                page.waitForSelector('#sec-overlay[style="display: block;"]')
            ])
        }
        
        // console.log("done racing")

        const overlayDisappeared = await waitForOverlayToDisappear(page)

        if (overlayDisappeared) {
            console.log("Detected overlay. It has now disappeared. Reloading page...");
            await page.reload();
            await page.waitForLoadState('load');
            continue;
        }

        let isSoldOutBonus00 = await page.$eval('label[for="flight-bonus00"]', (element) => {
            return element.textContent.includes('Sold Out');
        });

        let isSoldOutBonus01 = await page.$eval('label[for="flight-bonus01"]', (element) => {
            return element.textContent.includes('Sold Out');
        });

        let isSoldOutBonus10 = await page.$eval('label[for="flight-bonus10"]', (element) => {
            return element.textContent.includes('Sold Out');
        });
        
        // Check if Prestige Class for flight-bonus11 is sold out
        let isSoldOutBonus11 = await page.$eval('label[for="flight-bonus11"]', (element) => {
            return element.textContent.includes('Sold Out');
        });

        console.log("isSoldOutBonus01: " + isSoldOutBonus01 + " ,desiredTime: " + desiredTime);
        if ((desiredTime === "00:50" || desiredTime === "10:00") && !isSoldOutBonus01 && desiredClass === "1") {
            await page.click('label[for="flight-bonus01"]');
            await page.click('.payment-widget__confirm');
            break;
        } if ((desiredTime === "00:50" || desiredTime === "10:00") && !isSoldOutBonus00 && desiredClass === "2") {
            await page.click('label[for="flight-bonus00"]');
            await page.click('.payment-widget__confirm');
            break;
        } else if ((desiredTime === "13:30" || desiredTime === "19:30") && !isSoldOutBonus11 && desiredClass === "1") {
            await page.click('label[for="flight-bonus11"]');
            await page.click('.payment-widget__confirm');
            break;
        } else if ((desiredTime === "13:30" || desiredTime === "19:30") && !isSoldOutBonus10 && desiredClass === "2") {
            await page.click('label[for="flight-bonus10"]');
            await page.click('.payment-widget__confirm');
            break;
        } else {
            console.log("Sold out, refreshing.")
            await page.reload();
            await page.waitForLoadState('load');
        }
    }


    await page.waitForURL("https://www.koreanair.com/payment/gate/RT/NR");
    console.log("Filling info")

    await page.click('#submit-passenger-ADT-0');

    await page.waitForSelector('label[for="chk-save-contact-info"]');

    await page.click('#submit-contact')
    console.log("Selecting Timezone")
    await page.waitForSelector('select[class="ng-pristine ng-valid ng-touched"]');
    const options = await page.$$('select > option[value="4: ATL"]');
    if (options.length > 0) {
        const selectElement = await options[0].evaluateHandle((option) => option.parentElement);
        await selectElement.selectOption('4: ATL');
    }

    // Select the option
    // confirm -ghost ng-star-inserted

    await page.click('button.confirm[type="submit"]');
    await page.click('label[for="chk-save-contact-info"]');
    await page.click('#submit-contact');

    await page.waitForSelector('button[id="btn-resv-agree-1"]');
    await page.click('button[id="btn-resv-agree-1"]');

    for(let i=1; i<=2; i++) {
        await page.waitForSelector('button[id="btnScrollDown"]');
        await page.click('button[id="btnScrollDown"]');
        console.log("scroll down: ", i);
    }
    console.log('click confirm');
    await page.waitForSelector('button[id="btnConfirm"]');
    await page.click('button[id="btnConfirm"]');

    // await page.waitForSelector('button[class="confirm"][type="button"]');
    // await page.click('button[class="confirm"][type="button"]');
    
    await page.waitForSelector('button[id="btn-resv-agree-3"]');
    await page.click('button[id="btn-resv-agree-3"]');

    for(let i=1; i<=3; i++) {
        await page.waitForSelector('button[id="btnScrollDown"]');
        await page.click('button[id="btnScrollDown"]');
        console.log("scroll down: ", i);
    }

    console.log('click confirm');
    await page.waitForSelector('button[id="btnConfirm"]');
    await page.click('button[id="btnConfirm"]');

    
    // await page.waitForSelector('button[class="confirm"][type="button"]');
    // await page.click('button[class="confirm"][type="button"]');

    //
    // mileage
    const _mileage = await page.locator('button[class="payment-miles__miles"]').first().textContent();
    const mileage = parseInt(_mileage.replace(",", ""));
    console.log("mileage: " + mileage);

    // if (mileage.replace(/,/g, '') < 62500) {
    //     await page.click('button[id="select-button1"]');
    //     await page.click('button[aria-label="Use all - YOON NARI mileage"]');
    // }
    
    const _requiredMileage = await page.locator('span[class="payment-summary__value"]').first().textContent();
    const requiredMileage = parseInt(_requiredMileage.replace(",", ""));
    console.log("requiredMileage: " + requiredMileage);

    // let _moreRequiredMiles, moreRequiredMiles;

    if (requiredMileage > 0) { // mileage < requiredMileage

        async function getMoreRequiredMiles() {
            const _moreRequiredMiles = await page.locator('span[class="payment-summary__value"]').first().textContent();
            console.log("_moreRequiredMiles: " + _moreRequiredMiles);
        
            const numberString = _moreRequiredMiles.split(" ")[0].replace(",", "");
            const moreRequiredMiles = parseInt(numberString, 10);
            console.log("moreRequiredMiles: " + moreRequiredMiles);
        
            return moreRequiredMiles;
        }

        if (compareStringsIgnoreCase(userId, "biz4us")) { // Yoon then use miles of Nari, Joseph and Baek

            await page.click('button[id="select-button1"]');
            await page.click('button[aria-label="Use all - YOON NARI mileage"]');

            let moreRequiredMiles = await getMoreRequiredMiles();

            if (moreRequiredMiles > 0) {
                await page.click('button[id="select-button2"]');
                await page.click('button[aria-label="Use all - YOON JOSEPH mileage"]');

                moreRequiredMiles = await getMoreRequiredMiles();
            }

            if (moreRequiredMiles > 0) {
                await page.click('button[id="select-button0"]');
                await page.click('button[aria-label="Use all - BAEK KYOUNGSUN mileage"]');

                moreRequiredMiles = await getMoreRequiredMiles();
            }
        }

        if (compareStringsIgnoreCase(userId, "YOONLILY7")) { // kyoungsun baek then use miles of Nari, Joseph and Yoon
            console.log("I am here");
            await page.click('button[id="select-button1"]');
            await page.click('button[aria-label="Use all - YOON NARI mileage"]');

            let moreRequiredMiles = await getMoreRequiredMiles();
            console.log("miles needed: " + moreRequiredMiles);

            if (moreRequiredMiles > 0) {
                await page.click('button[id="select-button1"]');
                await page.click('button[aria-label="Use all - YOON JOSEPH mileage"]');
        
                moreRequiredMiles = await getMoreRequiredMiles();
            }

            if (moreRequiredMiles > 0) {
                await page.click('button[id="select-button0"]');
                await page.click('button[aria-label="Use all - YOON SANGCHEOL mileage"]');
        
                moreRequiredMiles = await getMoreRequiredMiles();
            }
            
        }

        if (compareStringsIgnoreCase(userId, "YOONNARI7")) { // Nari Yoon then use miles of Joseph, Yoon and Baek
            await page.click('button[id="select-button2"]');
            await page.click('button[aria-label="Use all - YOON JOSEPH mileage"]');

            let moreRequiredMiles = await getMoreRequiredMiles();

            if (moreRequiredMiles > 0) {
                await page.click('button[id="select-button0"]');
                await page.click('button[aria-label="Use all - YOON SANGCHEOL mileage"]');

                moreRequiredMiles = await getMoreRequiredMiles();
            }

            if (moreRequiredMiles > 0) {
                await page.click('button[id="select-button1"]');
                await page.click('button[aria-label="Use all - BAEK KYOUNGSUN mileage"]');

                moreRequiredMiles = await getMoreRequiredMiles();
            }
        }

        if (compareStringsIgnoreCase(userId, "YOONJOSE7")) { // Joseph then use miles of Nari, Yoon and Baek
            await page.click('button[id="select-button2"]');
            await page.click('button[aria-label="Use all - YOON JOSEPH mileage"]');

            let moreRequiredMiles = await getMoreRequiredMiles();

            if (moreRequiredMiles > 0) {
                await page.click('button[id="select-button0"]');
                await page.click('button[aria-label="Use all - YOON SANGCHEOL mileage"]');

                moreRequiredMiles = await getMoreRequiredMiles();
            }

            if (moreRequiredMiles > 0) {
                await page.click('button[id="select-button1"]');
                await page.click('button[aria-label="Use all - BAEK KYOUNGSUN mileage"]');

                moreRequiredMiles = await getMoreRequiredMiles();
            }
        }



        // await page.click('button[id="select-button1"]');
        // await page.click('button[aria-label="Use all - YOON NARI mileage"]');
        // let moreRequiredMiles = await page.locator('span[class="payment-summary__value"]').first().textContent();
        // console.log("moreRequiredMiles: " + moreRequiredMiles);
    }


    await page.click('#btnAwardUseMileageApply');

    // await page.click('#btnAwardUseMileageApply');
    //
    console.log("Entering card info");
    let skypass = page.locator('span[class="payment-method__icon -skypass-visa"]');
    if (skypassOrVisa === "skypass" && await skypass.count() > 0) {
        await skypass.click();
        await page.fill('input[formcontrolname="cardNumber"][id="ipt-cardNumber"]', skypassCCInfo);
        await page.fill('input[formcontrolname="expirationDate"][id="ipt-expirationDate"]', skypassExpDate);
        await page.fill('input[formcontrolname="verificationCode"][id="ipt-verificationCode"]', skypassSecureCode);
    } else {
        await page.click('label[for="rad-cbsc"]');
        await page.fill('input[formcontrolname="expirationDate"][id="ipt-expirationDate"]', visaExpDate);
        await page.fill('input[formcontrolname="verificationCode"][id="ipt-verificationCode"]', visaSecureCode);
        await page.click('label[for="chk-cbsc-save-card-info"]');
    }

    //
    // await page.click('label[for="chk-favorite-payment-type"]');


    // book flight
    console.log("Submitting payment... This is the end of the script, congratulations if successful")
    // PAYMENT BUTTON

    // *********************************************************
    if (testOrProd === "production") {
        await page.click('button[id="btn-payment"]')
    }
    // *********************************************************

    //PAYMENT BUTTON

    console.timeEnd("Script Duration")
})()

async function calendarSearch(page) {
    const lastDayElement = await page.locator('.flexible-calendar__day.ng-star-inserted[lastelement="true"]');
    const noFlightsElement = await lastDayElement.locator('.class-icon.-no-flight.ng-star-inserted');
    const isNoFlightsElementPresent = await noFlightsElement.count() > 0;
    if (isNoFlightsElementPresent) {
        // console.log("Refreshing");

        await page.waitForTimeout(500);
        await page.reload();
        await page.waitForLoadState('load');

        // console.log("done refreshing")
        await navigateAndSearchForFlights(page);
    } else {
        // console.log("last element click")
        await lastDayElement.click();

        const navigationPromise = page.waitForNavigation();
        await page.click('button[class="payment-widget__confirm"]');
        await navigationPromise;

        await navigateAndSearchForFlights(page);
    }
}

async function waitForOverlayToDisappear(page) {
    let overlayWasPresent = false;
    while (true) {
        const overlayStyle = await page.locator('#sec-overlay').getAttribute('style');
        // console.log(overlayStyle)
        if (overlayStyle === 'display: block;') {
            overlayWasPresent = true;
        } else return overlayWasPresent && overlayStyle !== 'display: block;';
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

    const overlayDisappeared = await waitForOverlayToDisappear(page)

    if (overlayDisappeared) {
        console.log("Detected overlay. It has now disappeared. Reloading page...");
        await page.reload();
        await page.waitForLoadState('load');

        await navigateAndSearchForFlights(page);
    }

    // Check if we've been redirected back to the search page due to no available flights
    if (page.url() === 'https://www.koreanair.com/booking/search') {
        console.log("No flights available, retrying...");

        const search = async () => {
            page.click('#bookingGateOnSearch')
        }
        const navigationPromise = page.waitForNavigation();
        setTimeout(search, 500); // Replace with the actual selector of the search button
        await navigationPromise;


        await navigateAndSearchForFlights(page);
    } else if (page.url() === 'https://www.koreanair.com/booking/calendar-fare-bonus') {
        console.log("No flights available, retrying...");

        await calendarSearch(page);
    }
}

function isValidCreditCardFormat(cc) {
    return /^\d{16}$/.test(cc);
}

function compareStringsIgnoreCase(str1, str2) {
    return str1.toLowerCase() === str2.toLowerCase();
}