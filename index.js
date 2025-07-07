const puppeteer = require('puppeteer');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
    // Max number of profiles to scrape.
    maxProfiles: 100,
    
    // Time period for posts (in days)
    timePeriodDays: 7,
    
    // Browser settings
    browserSettings: {
        headless: false, // Set to true to run without UI
        defaultViewport: null,
        args: [
            '--disable-web-security',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--start-maximized'
        ]
    },
    
    // Scrolling settings
    scrollSettings: {
        // Delay between scrolls in ms - needed to let content load and avoid x.com rate limiting.
        // set it high, like 2,000ms, and let this run in the background.
        scrollDelay: 3000,
        // Increased number of scrolls to load more content. i found 50 to be enough for everyone i follow.
        scrollCount: 30
    },
    
    // X.com URLs
    urls: {
        base: 'https://x.com',
        login: 'https://x.com/login'
    },
    
    // Target profiles to scrape (usernames without @ symbol).
    targetProfiles: [
        "astupple",
        "profvalterlongo",
        "ylecun",
        "bensbitesdaily",
        "alphasignalai",
        "GardnerPhD",
        "SeanPaulSpencer",
        "mike_lustgarten",
        "karpathy",
        "jmeistrich",
        "ChipkinLogan",
        "cstanley",
        "dschenkelman",
        "Physionic_PhD",
        "MichelleCen5",
        "minchoi",
        "VivaLongevity",
        "JonHaidt",
        "Austen",
        "SecScottBessent",
        "RobertGreene",
        "NutritionMadeS3",
        "cremieuxrecueil",
        "deedydas",
        "kamalravikant",
        "dan_steinhart",
        "marioyordanov_",
        "CommonSense",
        "iamjohnmackey",
        "simonw",
        "hubermanlab",
        "fentasyl",
        "arjunkhemani",
        "William_Blake",
        "JeffBezos",
        "garrytan",
        "hvpandya",
        "PalmerLuckey",
        "jorda0mega",
        "talmagejohnson_",
        "BillAckman",
        "Suhail",
        "mrmoneymustache",
        "Adamscrabble",
        "maxlugavere",
        "patrickc",
        "tobi",
        "levelsio",
        "dhh",
        "tednaiman",
        "bryan_johnson",
        "naval",
        "paulg",
        "Mangan150",
        "nntaleb",
        "friedberg",
        "chamath",
        "Jason",
        "DavidSacks"
      ],
    
    // Output file name
    outputFile: 'scraped_data.json'
};

// Helper function for timeout
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create readline interface for user input
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

// Function to wait for user input
function waitForEnter(message) {
    return new Promise(resolve => {
        const rl = createReadlineInterface();
        rl.question(message, () => {
            rl.close();
            resolve();
        });
    });
}

async function launchBrowser() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch(config.browserSettings);
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    return { browser, page };
}

async function handleManualLogin(page) {
    console.log('Navigating to X.com login page...');
    await page.goto(config.urls.login, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('Please log in manually to your X.com account in the opened browser window.');
    console.log('After you have successfully logged in, press Enter in this terminal to continue...');
    
    await waitForEnter('Press Enter when you have successfully logged in... ');
    
    console.log('Continuing with scraping...');
    await sleep(2000); // Give a moment after login
}

async function handleCaptcha(page) {
    console.log('Captcha detected! Please solve it manually...');
    
    // Wait for user to solve captcha
    await sleep(30000); // Wait 30 seconds
    
    // Check if captcha is still present
    const captchaPresent = await page.evaluate(() => {
        return document.querySelector('.captcha-container') !== null;
    });
    
    if (captchaPresent) {
        throw new Error('Captcha still present after 30 seconds. Please resolve manually and restart the script.');
    }
}

async function waitForPostsToLoad(page) {
    console.log('Waiting for posts to load...');
    try {
        // Wait for timeline to be present
        await page.waitForFunction(() => {
            return document.querySelectorAll('article').length > 0 || 
                   document.querySelectorAll('[data-testid="tweet"]').length > 0;
        }, { timeout: 10000 });
        console.log(`Found ${await page.evaluate(() => document.querySelectorAll('article').length)} articles`);
    } catch (error) {
        console.log('Timed out waiting for posts. Will try to continue anyway.');
    }
}

async function scrapeProfile(page, username) {
    // Helper function to extract posts and add to the content map
    async function extractAndAddPosts(page, contentMap, cutoffDate, username) {
        const newPosts = await page.evaluate((cutoffDate, profileUsername) => {
            const cutoffDateObj = new Date(cutoffDate);
            // Get all articles - these include original tweets, retweets, replies, etc.
            const articles = document.querySelectorAll('article');
            const results = [];
            
            for (const article of articles) {
                try {
                    // Find the time element to check if it's within our time period
                    const timeElement = article.querySelector('time');
                    if (!timeElement) continue;
                    
                    const datetime = timeElement.getAttribute('datetime');
                    if (!datetime) continue;
                    
                    const postDate = new Date(datetime);
                    
                    // Skip content older than our cutoff date
                    if (postDate < cutoffDateObj) continue;
                    
                    // Extract tweet ID and URL
                    let tweetId = '';
                    let tweetUrl = '';
                    
                    // Try to find a link to the specific tweet
                    const timeLink = timeElement.closest('a');
                    if (timeLink) {
                        const href = timeLink.getAttribute('href');
                        if (href && href.includes('/status/')) {
                            // This is likely the permalink to the tweet
                            if (href.startsWith('/')) {
                                tweetUrl = `https://x.com${href}`;
                            } else {
                                tweetUrl = href;
                            }
                            
                            // Extract the tweet ID from the URL
                            const match = href.match(/\/status\/(\d+)/);
                            if (match && match[1]) {
                                tweetId = match[1];
                            }
                        }
                    }
                    
                    // If we couldn't find the URL from the time element, look for other status links
                    if (!tweetUrl) {
                        const statusLinks = article.querySelectorAll('a[href*="/status/"]');
                        for (const link of statusLinks) {
                            const href = link.getAttribute('href');
                            // Skip links that are replies to other tweets
                            if (href && !link.closest('[data-testid="reply"]')) {
                                if (href.startsWith('/')) {
                                    tweetUrl = `https://x.com${href}`;
                                } else {
                                    tweetUrl = href;
                                }
                                
                                const match = href.match(/\/status\/(\d+)/);
                                if (match && match[1]) {
                                    tweetId = match[1];
                                }
                                break;
                            }
                        }
                    }
                    
                    // Last resort: construct URL from username and timestamp if we have a tweet ID
                    if (!tweetUrl && tweetId) {
                        tweetUrl = `https://x.com/${profileUsername}/status/${tweetId}`;
                    } else if (!tweetUrl) {
                        // If we still don't have a URL, try to construct it from the timestamp
                        // This is a fallback and won't be as accurate
                        const timestamp = postDate.getTime().toString();
                        tweetUrl = `https://x.com/${profileUsername}/status/${timestamp.substring(0, 10)}`;
                    }
                
                    // Extract content text - try multiple selectors
                    let contentText = '';
                    
                    // Primary text content
                    const tweetTextElement = article.querySelector('[data-testid="tweetText"]');
                    if (tweetTextElement) {
                        contentText = tweetTextElement.textContent;
                    } else {
                        // Try alternative text selectors
                        const textElements = article.querySelectorAll('[lang]');
                        if (textElements.length > 0) {
                            for (const elem of textElements) {
                                if (elem.textContent && elem.textContent.trim() !== '') {
                                    contentText = elem.textContent;
                                    break;
                                }
                            }
                        }
                        
                        // If still no content, try another selector
                        if (!contentText) {
                            const dirAutoElements = article.querySelectorAll('[dir="auto"]');
                            for (const elem of dirAutoElements) {
                                if (elem.textContent && elem.textContent.trim() !== '') {
                                    contentText = elem.textContent;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Save the tweet information
                    results.push({
                        content: contentText || 'No content found',
                        date: datetime,
                        url: tweetUrl
                    });
                } catch (err) {
                    console.log('Error processing tweet:', err);
                }
            }
            
            return results;
        }, cutoffDate.toISOString(), username);
        
        // Add new posts to the map using URL as key to avoid duplicates
        for (const post of newPosts) {
            if (post.url && !contentMap.has(post.url)) {
                contentMap.set(post.url, post);
            }
        }
        
        return newPosts.length;
    }
    
    const url = `${config.urls.base}/${username}`;
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for content to load
    await sleep(1000);
    
    // Check for captcha
    const hasCaptcha = await page.evaluate(() => {
        return document.querySelector('.captcha-container') !== null;
    });
    
    if (hasCaptcha) {
        await handleCaptcha(page);
    }
    
    // Wait for posts to load
    await waitForPostsToLoad(page);
    
    console.log('Scrolling and extracting posts incrementally...');
    // Create a Map to store unique posts (using URL as the key)
    // Using a map to avoid duplicates since we'll be extracting content multiple times
    const allContentMap = new Map();
    const cutoffDate = new Date(Date.now() - (config.timePeriodDays * 24 * 60 * 60 * 1000));
    
    // Extract initial posts before scrolling
    console.log('Extracting initial posts...');
    await extractAndAddPosts(page, allContentMap, cutoffDate, username);
    
    // Scroll and extract content after each scroll
    for (let i = 0; i < config.scrollSettings.scrollCount; i++) {
        // Scroll down
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await sleep(config.scrollSettings.scrollDelay);
        console.log(`Scroll ${i + 1}/${config.scrollSettings.scrollCount} completed`);
        
        // Extract content after each scroll
        await extractAndAddPosts(page, allContentMap, cutoffDate, username);
        console.log(`Posts collected so far: ${allContentMap.size}`);
    }
    
    // Debug: Log available selectors on the page for troubleshooting
    const debugInfo = await page.evaluate(() => {
        return {
            articles: document.querySelectorAll('article').length,
            tweets: document.querySelectorAll('[data-testid="tweet"]').length,
            tweetTimes: document.querySelectorAll('time').length,
            possibleTweets: document.querySelectorAll('[role="article"]').length
        };
    });
    console.log('Debug page info:', debugInfo);
    
    // Convert the Map values to an array for the final result
    const allContent = Array.from(allContentMap.values());
    
    console.log(`Found ${allContent.length} posts from the last ${config.timePeriodDays} days`);
    
    return {
        username,
        content: allContent,
        scrapeDate: new Date().toISOString()
    };
}

async function main() {
    let browser;
    try {
        console.log('Starting X.com profile scraper...');
        const browserData = await launchBrowser();
        browser = browserData.browser;
        const page = browserData.page;
        
        // Add manual login step
        await handleManualLogin(page);
        
        // Get usernames from config
        const usernames = config.targetProfiles;
            
        if (usernames.length === 0) {
            console.error('No target profiles specified. Please add profiles to the config object');
            await browser.close();
            return;
        }
        
        console.log(`Found ${usernames.length} profiles to scrape. Will scrape up to ${config.maxProfiles}.`);
        
        const results = [];
        
        for (let i = 0; i < Math.min(usernames.length, config.maxProfiles); i++) {
            console.log(`Scraping profile ${i + 1}/${Math.min(usernames.length, config.maxProfiles)}: ${usernames[i]}`);
            try {
                const profileData = await scrapeProfile(page, usernames[i]);
                results.push(profileData);
                console.log(`Successfully scraped ${profileData.content.length} content items from ${usernames[i]}`);
            } catch (error) {
                console.error(`Error scraping ${usernames[i]}:`, error.message);
                continue;
            }
        }
        
        // Get output file name from config
        const outputFile = config.outputFile;
        
        // Save results as JSON
        fs.writeFileSync(
            outputFile,
            JSON.stringify(results, null, 2)
        );
        console.log(`Scraping completed successfully! Results saved to ${outputFile}`);
        
        // Save results as markdown
        const markdownFileName = outputFile.replace('.json', '.md');
        const markdownContent = generateMarkdown(results);
        fs.writeFileSync(markdownFileName, markdownContent);
        console.log(`Results also saved to markdown file: ${markdownFileName}`);
        
        await browser.close();
    } catch (error) {
        console.error('Error in main:', error);
    }
}

// Function to generate markdown from scraped data
function generateMarkdown(data) {
    let markdown = "";
    
    data.forEach(profile => {
        // Add username as header level 1
        markdown += `# ${profile.username}\n\n`;
        
        // Check if content exists and is not empty
        if (profile.content && profile.content.length > 0) {
            // Add each content item as a numbered list item
            profile.content.forEach((item, index) => {
                // Include content text and link to the original post
                markdown += `${item.content}\n[open](${item.url})\n\n---\n\n`;
            });
        } else {
            markdown += "No content found for this user.\n\n";
        }
        
        markdown += "---\n\n"; // Add separator between profiles
    });
    
    return markdown;
}

main();
