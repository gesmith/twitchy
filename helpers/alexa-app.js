var AlexaApp = require('alexa-app');
var alexa = new AlexaApp.app('twitchy');
var twitch = require('./twitch.js');
var _ = require('lodash');
var Promise = require('bluebird');

var respondWithProcessingError = response => {
  // Catch-all response when API error occurs.
  response.say('There was an error processing your request.').shouldEndSession(false).send();
};

alexa.launch((request, response) => {
  response.say("You launched Twitchy!");
});

// Run before any Alexa request.
alexa.pre = (request, response, type) => {
  if (!request.sessionDetails.accessToken) {
    response.clear().say("You first need to authorize this skill to use your Twitch account.").send();
  }
};

var getAuthUser = token => {
  var promise = Promise.promisify(twitch.getAuthenticatedUser.bind(twitch));
  return promise(token);
};

var reprompt = 'Can you repeat that?';

alexa.intent("getTopGames", {
    "slots": {
      "LIMIT": "NUMBER"
    },
    "utterances": [
      "get {|the} top {-|LIMIT} {|video} games",
      "what are the top {-|LIMIT} {|video} games"
    ]
  },
  (request, response) => {
    var limit = parseInt(request.slot('LIMIT')) || 5; // Default to the first 5 top games.
    console.log(limit);
    var params = {};
    params.limit = limit;

    var getTopGames = Promise.promisify(twitch.getTopGames.bind(twitch));
    getTopGames(params).then(res => {
      var topGames = _.map(res.top, 'game.name');
      response.say(`The top ${limit} games are: ${topGames}.`).shouldEndSession(false).send();
    }).catch(e => {
      console.log(e);
      respondWithProcessingError(response);
    });
    return false;
  }
);

alexa.intent("getMyFollowerCount", {
    "slots": {},
    "utterances": [
      "how {many|much} followers {|do|does} {my|I} {stream|channel|I} have",
      "get my {|stream's|channel's} {follower|followers} count"
    ]
  },
  (request, response) => {
    var token = request.sessionDetails.accessToken;
    var getAuthUserChannel = Promise.promisify(twitch.getAuthenticatedUserChannel.bind(twitch));
    // requires channel_editor scope
    getAuthUserChannel(token).then(res => {
      var followerCount = res.followers;
      response.say(`Your stream has ${followerCount} followers.`).shouldEndSession(false).send();
    }).catch(e => {
      respondWithProcessingError(response);
    });
    return false;
  }
);

alexa.intent("getMySubscriberCount", {
    "slots": {},
    "utterances": [
      "how {many|much} {subscribers|subscriptions} {|do|does} {my|I} {stream|channel|I} have",
      "get my {|stream's|channel's} {subscriber|subscription} count"
    ]
  },
  (request, response) => {
    var token = request.sessionDetails.accessToken;
    // requires channel_editor scope
    getAuthUser(token).then(userRes => {
      var username = userRes.name;
      var getChannelSubscriptions = Promise.promisify(twitch.getChannelSubscriptions.bind(twitch));
      getChannelSubscriptions(username, token, {}).then(res => {
        var subscriberCount = res._total;
        response.say(`Your stream has ${subscriberCount} subscribers.`).shouldEndSession(false).send();
      }).catch(e => {
        if (e.status === 422) {
          //"channelName does not have a subscription program"
          response.say(`${e.message}.`).shouldEndSession(false).send();
        } else {
          respondWithProcessingError(response);
        }
      });
    });
    return false;
  }
);

alexa.intent('updateChannelTitle', {
    "slots": {
      "STATUS": "CHANNEL_TITLE"
    },
    "utterances": [
      "{set|update|make|change} {|my|the} {|stream|stream's|channel|channel's} {title|status} {|to} {-|STATUS}"
    ]
  },
  (request, response) => {
    var token = request.sessionDetails.accessToken;
    var status = request.slot('STATUS');

    if (_.isEmpty(status)) {
      response.say('I didn\'t hear a status.').shouldEndSession(false);
      return true;
    } else {
      getAuthUser(token).then(userRes => {
        var username = userRes.name;
        var updateChannel = Promise.promisify(twitch.updateChannel.bind(twitch));
        var params = [username, token, { channel: { status }}];
        updateChannel(...params).then(() => {
          response.say('Your title has been updated.').shouldEndSession(false).send();
        }).catch(e => {
          respondWithProcessingError(response);
        });
      });
      return false;
    }
  }
);

alexa.intent('updateChannelsCurrentCategory', {
    "slots": {
      "CATEGORY": "CHANNEL_CATEGORY"
    },
    "utterances": [
      "{set|update|make|change} {|my|the} {|stream|stream's|channel|channel's} {game|category} {|to} {-|CATEGORY}"
    ]
  },
  (request, response) => {
    var token = request.sessionDetails.accessToken;
    var category = request.slot('CATEGORY');
    if (_.isEmpty(category)) {
      response.say('I didn\'t hear a category or game.').shouldEndSession(false);
      return true;
    } else {
      var searchGames = Promise.promisify(twitch.searchGames.bind(twitch));
      var updateChannel = Promise.promisify(twitch.updateChannel.bind(twitch));
      getAuthUser(token).then(userRes => {
        var username = userRes.name;
        // Since the user should only be able to update their game/category to one that is available on twitch,
        // search by the category they specified and use the one that best matches.
        searchGames({ query: category, type: 'suggest' }).then(searchRes => {
          if (searchRes.games.length) {
            var queriedGameName = searchRes.games[0].name;
            var params = [username, token, { channel: { game: queriedGameName }}];
            // requires channel_editor scope
            updateChannel(...params).then(() => {
              response.say('Your current category has been updated.').shouldEndSession(false).send();
            }).catch(e => {
              respondWithProcessingError(response);
            });
          } else {
            response.say('I couldn\'t find a category with that name.').shouldEndSession(false).send();
          }
        });
      });
      return false;
    }
  }
);

alexa.intent('startCommercial', {
    "slots": {
      "DURATION": "COMMERCIAL_DURATION"
    },
    "utterances": [
      "{start|play|show} {|a|an|the} {commercial|ad|advertisement} {|for} {-|DURATION} {|seconds}",
      "{start|play|show} {|a|an|the} {-|DURATION} {|second|seconds} {commercial|ad|advertisement}"
    ]
  },
  (request, response) => {
    var token = request.sessionDetails.accessToken;
    getAuthUser(token).then((userRes) => {
      var channel = userRes.name;
      var startCommercial = Promise.promisify(twitch.startCommercial.bind(twitch));
      var duration = request.slot('DURATION') || 30;
      startCommercial(channel, token, { length: duration }).then((res) => {
        response.say(`Starting a ${duration} second commercial break.`).shouldEndSession(false).send();
      }).catch(e => {
        if (e.status === 422) {
          // 'Commercials breaks are allowed every 8 min and only when you are online.'
          response.say(`${e.message}`).shouldEndSession(false).send();
        } else {
          respondWithProcessingError(response);
        }
      });
    });
    return false;
  }
);

alexa.intent('getFollowedStreams', {
    "slots": {},
    "utterances": [
      "which {|of} {|my} followed {streams|channels} are {online|live}",
      "get {|my} followed streams",
      "who on my following list is {online|live}",
      "who is {live|streaming|live streaming} {|right} now"
    ]
  },
  (request, response) => {
    var token = request.sessionDetails.accessToken;
    var getAuthUserFollowedStreams = Promise.promisify(twitch.getAuthenticatedUserFollowedStreams.bind(twitch));
    getAuthUserFollowedStreams(token, { stream_type: 'live' }).then(res => {
      var streams = _.map(res.streams, 'channel.display_name');
      if (streams.length) {
        response.say(`Live streams are: ${streams}.`).shouldEndSession(false).send();
      } else {
        response.say('None of your followed streams are online.').shouldEndSession(false).send();
      }
    }).catch(e => {
      respondWithProcessingError(response);
    });
    return false;
  }
);

module.exports = alexa;
