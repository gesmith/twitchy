var TwitchAPI = require('twitch-api');

var twitch = new TwitchAPI({
  clientId: process.env.TWITCHTV_CLIENT_ID,
  clientSecret: process.env.TWITCHTV_CLIENT_SECRET,
  redirectUri: process.env.TWITCHTV_REDIRECT_URI,
  scopes: ["user_read", "channel_read", "channel_editor", "channel_commercial", "channel_subscriptions"]
});

module.exports = twitch;
