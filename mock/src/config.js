// Configuration Constants
const CONFIG = {
  localhost: {
    usersBaseURL: `https://localhost:${7259}/api/Users`,
    newsBaseURL: `https://localhost:${7259}/api/News`,
    tagsBaseURL: `https://localhost:${7259}/api/Tags`,
    savedArticlesBaseURL: `https://localhost:${7259}/api/SavedArticles`,
    sharedContentBaseURL: `https://localhost:${7259}/api/SharedContent`,
    userSettingsBaseURL: `https://localhost:${7259}/api/UserSettings`,
    adminBaseURL: `https://localhost:${7259}/api/Admin`,
  },
  production: {
    usersBaseURL: "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/Users",
    newsBaseURL: "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/News",
    tagsBaseURL: "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/Tags",
    savedArticlesBaseURL:
      "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/SavedArticles",
    sharedContentBaseURL:
      "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/SharedContent",
    userSettingsBaseURL:
      "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/UserSettings",
    adminBaseURL: "https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/Admin",
  },
};

const isLocalHost =
  ["localhost", "127.0.0.1"].includes(location.hostname) ||
  location.protocol === "file:";
const USERS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.usersBaseURL
  : CONFIG.production.usersBaseURL;
const NEWS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.newsBaseURL
  : CONFIG.production.newsBaseURL;
const TAGS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.tagsBaseURL
  : CONFIG.production.tagsBaseURL;
const SAVED_ARTICLES_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.savedArticlesBaseURL
  : CONFIG.production.savedArticlesBaseURL;
const SHARED_CONTENT_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.sharedContentBaseURL
  : CONFIG.production.sharedContentBaseURL;
const USER_SETTINGS_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.userSettingsBaseURL
  : CONFIG.production.userSettingsBaseURL;
const ADMIN_SERVER_PATH = isLocalHost
  ? CONFIG.localhost.adminBaseURL
  : CONFIG.production.adminBaseURL;

// News Endpoints
const NEWS_ENDPOINTS = {
  BASE: () => `${NEWS_SERVER_PATH}`,
  SPECIFIC_NEWS: () => `${NEWS_ENDPOINTS.BASE()}/SpecificNews`,
  SPECIFIC_NEWS_WITH_SENTIMENT: () =>
    `${NEWS_ENDPOINTS.BASE()}/SpecificNewsWithSentiment`,
  TOP_HEADLINES: () => `${NEWS_ENDPOINTS.BASE()}/TopHeadlines`,
  TOP_HEADLINES_WITH_SENTIMENT: () =>
    `${NEWS_ENDPOINTS.BASE()}/TopHeadlinesWithSentiment`,
  SEARCH_BY_TAGS: () => `${NEWS_ENDPOINTS.BASE()}/SearchByTags`,
  SEARCH_BY_TAGS_WITH_SENTIMENT: () =>
    `${NEWS_ENDPOINTS.BASE()}/SearchByTagsWithSentiment`,
  DAILY_SUMMARY: () => `${NEWS_ENDPOINTS.BASE()}/DailySummary`,
};

// User Endpoints
const USER_ENDPOINTS = {
  BASE: () => `${USERS_SERVER_PATH}`,
  REGISTER: () => `${USER_ENDPOINTS.BASE()}/register`,
  LOGIN: () => `${USER_ENDPOINTS.BASE()}/login`,
  LOGOUT: () => `${USER_ENDPOINTS.BASE()}/logout`,
  VALIDATE: () => `${USER_ENDPOINTS.BASE()}/validate`,
};

// Tags Endpoints
const TAGS_ENDPOINTS = {
  BASE: () => `${TAGS_SERVER_PATH}`,
  GET_ALL_TAGS: () => `${TAGS_ENDPOINTS.BASE()}/tags`,
};

// Saved Articles Endpoints
const SAVED_ARTICLES_ENDPOINTS = {
  BASE: () => `${SAVED_ARTICLES_SERVER_PATH}`,
  USER_SAVED_ARTICLES: () => `${SAVED_ARTICLES_ENDPOINTS.BASE()}/user`,
  SEARCH_SAVED_ARTICLES: () => `${SAVED_ARTICLES_ENDPOINTS.BASE()}/user/search`,
  SAVE_ARTICLE: () => `${SAVED_ARTICLES_ENDPOINTS.BASE()}`,
  REMOVE_SAVED_ARTICLE: () => `${SAVED_ARTICLES_ENDPOINTS.BASE()}/article`,
};

// Shared Content Endpoints
const SHARED_CONTENT_ENDPOINTS = {
  BASE: () => `${SHARED_CONTENT_SERVER_PATH}`,
  GET_SHARED_CONTENT: () => `${SHARED_CONTENT_ENDPOINTS.BASE()}/user`,
  SHARE_CONTENT: () => `${SHARED_CONTENT_ENDPOINTS.BASE()}`,
  REPORT_CONTENT: () => `${SHARED_CONTENT_ENDPOINTS.BASE()}/report`,
  LIKE_CONTENT: () => `${SHARED_CONTENT_ENDPOINTS.BASE()}/like`,
  UNLIKE_CONTENT: () => `${SHARED_CONTENT_ENDPOINTS.BASE()}/unlike`,
  DISLIKE_CONTENT: () => `${SHARED_CONTENT_ENDPOINTS.BASE()}/dislike`,
  UNDISLIKE_CONTENT: () => `${SHARED_CONTENT_ENDPOINTS.BASE()}/undislike`,
};

// User Settings Endpoints
const USER_SETTINGS_ENDPOINTS = {
  BASE: () => `${USER_SETTINGS_SERVER_PATH}`,
  GET_USER_SETTINGS: () => `${USER_SETTINGS_ENDPOINTS.BASE()}`,
  BLOCK_USER: () => `${USER_SETTINGS_ENDPOINTS.BASE()}/block`,
  UNBLOCK_USER: () => `${USER_SETTINGS_ENDPOINTS.BASE()}/unblock`,
};

// Admin Endpoints
const ADMIN_ENDPOINTS = {
  BASE: () => `${ADMIN_SERVER_PATH}`,
  DAILY_STATS: () => `${ADMIN_ENDPOINTS.BASE()}/stats/daily`,
  STATS_RANGE: () => `${ADMIN_ENDPOINTS.BASE()}/stats/range`,
  GET_ALL_USERS: () => `${ADMIN_ENDPOINTS.BASE()}/users`,
  TOGGLE_USER_STATUS: (userId) =>
    `${ADMIN_ENDPOINTS.BASE()}/users/${userId}/status`,
  GET_REPORTED_CONTENT: () => `${ADMIN_ENDPOINTS.BASE()}/reported-content`,
  HANDLE_REPORTED_CONTENT: (contentId) =>
    `${ADMIN_ENDPOINTS.BASE()}/reported-content/${contentId}/handle`,
};

// URL Constants
const urls = {
  news: {
    base: NEWS_ENDPOINTS.BASE(),
    specificNews: NEWS_ENDPOINTS.SPECIFIC_NEWS(),
    specificNewsWithSentiment: NEWS_ENDPOINTS.SPECIFIC_NEWS_WITH_SENTIMENT(),
    topHeadlines: NEWS_ENDPOINTS.TOP_HEADLINES(),
    topHeadlinesWithSentiment: NEWS_ENDPOINTS.TOP_HEADLINES_WITH_SENTIMENT(),
    searchByTags: NEWS_ENDPOINTS.SEARCH_BY_TAGS(),
    searchByTagsWithSentiment: NEWS_ENDPOINTS.SEARCH_BY_TAGS_WITH_SENTIMENT(),
    dailySummary: NEWS_ENDPOINTS.DAILY_SUMMARY(),
  },
  users: {
    base: USER_ENDPOINTS.BASE(),
    register: USER_ENDPOINTS.REGISTER(),
    login: USER_ENDPOINTS.LOGIN(),
    logout: USER_ENDPOINTS.LOGOUT(),
  },
  tags: {
    base: TAGS_ENDPOINTS.BASE(),
    getAllTags: TAGS_ENDPOINTS.GET_ALL_TAGS(),
  },
  savedArticles: {
    base: SAVED_ARTICLES_ENDPOINTS.BASE(),
    userSavedArticles: SAVED_ARTICLES_ENDPOINTS.USER_SAVED_ARTICLES(),
    searchSavedArticles: SAVED_ARTICLES_ENDPOINTS.SEARCH_SAVED_ARTICLES(),
    saveArticle: SAVED_ARTICLES_ENDPOINTS.SAVE_ARTICLE(),
    removeSavedArticle: SAVED_ARTICLES_ENDPOINTS.REMOVE_SAVED_ARTICLE(),
  },
  sharedContent: {
    base: SHARED_CONTENT_ENDPOINTS.BASE(),
    getSharedContent: SHARED_CONTENT_ENDPOINTS.GET_SHARED_CONTENT(),
    shareContent: SHARED_CONTENT_ENDPOINTS.SHARE_CONTENT(),
    reportContent: SHARED_CONTENT_ENDPOINTS.REPORT_CONTENT(),
    likeContent: SHARED_CONTENT_ENDPOINTS.LIKE_CONTENT(),
    unlikeContent: SHARED_CONTENT_ENDPOINTS.UNLIKE_CONTENT(),
    dislikeContent: SHARED_CONTENT_ENDPOINTS.DISLIKE_CONTENT(),
    undislikeContent: SHARED_CONTENT_ENDPOINTS.UNDISLIKE_CONTENT(),
  },
  userSettings: {
    base: USER_SETTINGS_ENDPOINTS.BASE(),
    getUserSettings: USER_SETTINGS_ENDPOINTS.GET_USER_SETTINGS(),
    blockUser: USER_SETTINGS_ENDPOINTS.BLOCK_USER(),
    unblockUser: USER_SETTINGS_ENDPOINTS.UNBLOCK_USER(),
  },
  admin: {
    base: ADMIN_ENDPOINTS.BASE(),
    dailyStats: ADMIN_ENDPOINTS.DAILY_STATS(),
    statsRange: ADMIN_ENDPOINTS.STATS_RANGE(),
    getAllUsers: ADMIN_ENDPOINTS.GET_ALL_USERS(),
    getReportedContent: ADMIN_ENDPOINTS.GET_REPORTED_CONTENT(),
  },
};
