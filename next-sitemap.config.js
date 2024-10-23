module.exports = {
  siteUrl: 'https://www.rahimicustomconstruction.com', // Replace with your actual domain
  generateRobotsTxt: true, // Automatically generate a robots.txt file
  exclude: ['/invoices', '/login'], // Exclude admin pages from the sitemap
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/invoices', '/login'],
      }, // Disallow crawling admin pages
    ],
  },
};
