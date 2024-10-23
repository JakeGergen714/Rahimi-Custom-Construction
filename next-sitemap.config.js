module.exports = {
  siteUrl: 'https://www.rahimicustomconstruction.com', // Replace with your actual domain
  generateRobotsTxt: true, // Automatically generate a robots.txt file
  exclude: ['/invoices', '/login', '/gallery'], // Exclude admin pages from the sitemap
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/invoices', '/login', '/gallery'],
      }, // Disallow crawling admin pages
    ],
  },
};
