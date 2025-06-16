/**
 * Script to convert scraped X.com data from JSON to markdown
 * This script processes the scraped_data.json file and creates a formatted markdown file 
 * with sections for each user and their content, linked to the original sources
 */

const fs = require('fs');
const path = require('path');

// Read the JSON data
try {
  const rawData = fs.readFileSync(path.join(__dirname, 'scraped_data.json'), 'utf8');
  const userData = JSON.parse(rawData);

  // Prepare the markdown content
  let markdownContent = '# X.com Scraped Content\n\n';

  // Process each user
  userData.forEach(user => {
    // Only add users that have content
    if (user.content && user.content.length > 0) {
      // Add user header
      markdownContent += `## @${user.username}\n\n`;
      
      // Process each content item
      user.content.forEach((item, index) => {
        // Skip items with no content or marked as "No content found"
        if (item.content && item.content !== "No content found") {
          // Add the content text
          markdownContent += `${item.content}\n\n`;
          
          // Add source link
          markdownContent += `[Source](${item.url})\n\n`;
          
          // Add horizontal rule if not the last item
          if (index < user.content.length - 1) {
            markdownContent += `---\n\n`;
          }
        }
      });
      
      // Add extra space between users
      markdownContent += '\n';
    }
  });

  // Write to markdown file
  fs.writeFileSync(path.join(__dirname, 'scraped_content.md'), markdownContent, 'utf8');
  console.log('Markdown file created successfully: scraped_content.md');
} catch (error) {
  console.error('Error processing the data:', error);
}
