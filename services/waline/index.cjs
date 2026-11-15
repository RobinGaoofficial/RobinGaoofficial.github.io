// Authentication is enforced on the server, including direct API requests.
process.env.LOGIN = 'force';
process.env.COMMENT_AUDIT = 'false';
process.env.DISABLE_USERAGENT = 'true';
process.env.DISABLE_REGION = 'true';
process.env.AKISMET_KEY = 'false';
process.env.SITE_NAME = '高彬斌的博客';
process.env.SITE_URL = 'https://gaobinbin.dev';
process.env.IPQPS = '60';

const Application = require('@waline/vercel');
module.exports = Application({});
