# vibe-coded noise reducing aggregator

personal project that massively reduced the time i spend on x.com, news, etc, and keeps me away from those sites. i now catch up with the content i care about in less than an hour, once a week.

it collects all recent content (i.e., since i last ran it) from the sources i care about and aggregate them all into a single huge markdown file. i then use the prompts below with gen ai tools like notebooklm, gemini pro, etc to categorize and summarize the content.

excuse the code, it is all vibe coded in between other things, a couple of minutes at a time. this is not meant to be reused. i am sharing because it helped me save a lot of time, and it may inspire others to do something similar.

ps: the unexpected realization, after seeing all the content together and the gen ai summary and interactions, is how futile it all is. these apps are a huge waste of time. there is something better to do with our time.

## brainstorm new features
1. intake from news sources i read
2. intake from email subs
3. remove sponsored content
4. call ai apis directly to generate categories and summary instead of having to drop it into notebooklm
5. pull images
6. embed tweets into website report instead of notebooklm note

## video demo
none - let me know if you would like one and i may work on it.

## how to use 
assumption: you are familiar with running node apps.

1. update config in index.js. see comments in config fields.
2. run `npm run start`.
3. login to x.com in the opened browser window.
4. come back to the terminal and press enter.
5. wait for the script to finish. `scraped_data.json` and `scraped_data.md` should have all the content.
6. use the prompts below with gen ai tools like notebooklm, gemini pro, etc to categorize and summarize the content.
7. consume as preferred. i review the summary and see how much i want to read from the markdown with all the content. the summary has links to the original sources, so i end up barely reading the markdown with all the content.

# prompts

## current "working" approaches

### notebooklm summary

create a summary with the following requirements:

- organize the content by category. come up with the categories based on the content (for example, politics, software engineering, health and nutrition, etc).

- list the users that belong to each category, comma separated, under the header for the section. each user should have a link to their x.com profile (e.g. https://x.com/Austen for "Austen").

- summarize the content within each category. the summary should be succinct and informative. it should include key points, recommendations, takeaways. it should have the key points bolded. To ensure maximum clarity and effectiveness, paraphrase and condense the information without losing any crucial context. Rely strictly on the provided text, without including external information. a fast reader should be able to read the summary for each category in under 10 minutes. 

- the summary should have reference links to the relevant tweets formatted like [1], where clicking on [1] opens the related tweet in a new tab. make sure clicking on the reference link opens the tweet in a new tab.

- there is a table of content at the top with all the categories in the document.

### ⚠️ with canvas (google gemini) - WIP - doesn't seem to work

#### all content website

this json contains scraped data from x.com (twitter). it is a json that is an array of user objects. each user object has the username and  an array of content. the content object contains the content in a field called "content", and the url to the tweet in a field called "url". Below is an example

```json
[
  {
    "username": "Austen", // the username
    "content": [ // all the tweets for this user
      {
        "content": "Alex Burkardt came in during the last cohort of Gauntlet AI to meet some students and see what was going on.\n\nThe way he describes what was happening captures the spirit of Gauntlet AI better than anything else I've seen.\n\nJust watch the first minute.", // the content of the tweet
        "date": "2025-06-14T02:23:05.000Z", // the date of the tweet, ignore it
        "url": "https://x.com/Austen/status/1933711760797643137" // the url for the tweet
      },
      ...
    ],
    "scrapeDate": "2025-06-14T11:27:24.044Z" // the date the data was scraped, ignore it
  },
  ...
```

create a website with the following requirements:

- organize the content by category. come up with the categories based on the content (for example, politics, software engineering, health and nutrition, etc).

- list the users that belong to each category, comma separated, under the header for the section. each user should have a link to their x.com profile (e.g. https://x.com/Austen for "Austen").

- there is a section for each user within a category. this user section has all the content for each user. there is a linebreak between each piece of content. there is a link to the source ("url" field provided by the content object) for each piece of content.

- there is a menu with all the categories and users in the document.

- it is a minimalistic website that uses fonts and styling that makes the content easy to read

#### summary markdown

this json contains scraped data from x.com (twitter). it is a json that is an array of user objects. each user object has the username and  an array of content. the content object contains the content in a field called "content", and the url to the tweet in a field called "url". Below is an example

```json
[
  {
    "username": "Austen", // the username
    "content": [ // all the tweets for this user
      {
        "content": "Alex Burkardt came in during the last cohort of Gauntlet AI to meet some students and see what was going on.\n\nThe way he describes what was happening captures the spirit of Gauntlet AI better than anything else I've seen.\n\nJust watch the first minute.", // the content of the tweet
        "date": "2025-06-14T02:23:05.000Z", // the date of the tweet, ignore it
        "url": "https://x.com/Austen/status/1933711760797643137" // the url for the tweet
      },
      ...
    ],
    "scrapeDate": "2025-06-14T11:27:24.044Z" // the date the data was scraped, ignore it
  },
  ...
```

create a markdown file with the following requirements:

- organize the content by category. come up with the categories based on the content (for example, politics, software engineering, health and nutrition, etc).

- list the users that belong to each category, comma separated, under the header for the section. each user should have a link to their x.com profile (e.g. https://x.com/Austen for "Austen").

- summarize the content within each category. the summary should be succinct and informative. it should include key points, recommendations, takeaways. it should have the key points bolded. To ensure maximum clarity and effectiveness, paraphrase and condense the information without losing any crucial context. Rely strictly on the provided text, without including external information. a fast reader should be able to read the summary for each category in under 10 minutes. 

- the summary should have reference links to the relevant tweets formatted like [1], where clicking on [1] opens the related tweet in a new tab. make sure clicking on the reference link opens the tweet in a new tab.

- there is a table of content at the top with all the categories in the document.

## abandoned approaches

### using google gemini canvas

this json contains scraped data from x.com (twitter). it is a json that is an array of user objects. each user object has the username and  an array of content. the content object contains the content in a field called "content", and the url to the tweet in a field called "url". Below is an example

```json
[
  {
    "username": "Austen", // the username
    "content": [ // all the tweets for this user
      {
        "content": "Alex Burkardt came in during the last cohort of Gauntlet AI to meet some students and see what was going on.\n\nThe way he describes what was happening captures the spirit of Gauntlet AI better than anything else I've seen.\n\nJust watch the first minute.", // the content of the tweet
        "date": "2025-06-14T02:23:05.000Z", // the date of the tweet, ignore it
        "url": "https://x.com/Austen/status/1933711760797643137" // the url for the tweet
      },
      ...
    ],
    "scrapeDate": "2025-06-14T11:27:24.044Z" // the date the data was scraped, ignore it
  },
  ...
```

generate a website to make it easier for me to consume all this content. these are the requirements

- it has a pinned table of content, or menu, on the left hand side, and the entirety of the content on the right hand side.

- it has a level 1 section, "all", where all the content is organized by user. there is a header for each user, and all the content for that user is under that header. each tweet can be clicked to open the tweet in a new tab. use the "url" field provided by the content object. the users are 

- the "all" section has a subsections where the categories and users within the categories are listed.

- the pinned menu has a search bar that allows the user to search for content by username or category. the search is case-insensitive and flexible, and searches through the entire menu.

- it has a "summarized" level 1 section where it has all the content within each category summarized. summary should be succinct and informative. a fast reader should be able to read the summary for each category in under 10 minutes. it should have the key points bolded. list the users that belong to each category, comma separated, before the summary. each user should have a link to their x.com profile (e.g. https://x.com/Austen for "Austen"). the summary should have reference links to the relevant tweets formatted like [1], where clicking on [1] opens the related tweet in a new tab. make sure clicking on the reference link opens the tweet in a new tab.

- the "summarized" section has a subsections where the categories are listed.
