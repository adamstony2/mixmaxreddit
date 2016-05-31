var key = require('../utils/key');
var sync = require('synchronize');
var request = require('request');
var _ = require('underscore');


// The Type Ahead API.
module.exports = function(req, res) {
  var term = req.query.text.trim();
  if (!term) {
    res.json([{
      title: '<i>(enter a search term)</i>',
      text: ''
    }]);
    return;
  }

  var response;
  try {
    response = sync.await(request({
      url: 'http://www.reddit.com/r/' + term + '.json',
      gzip: true,
      json: true,
      timeout: 10 * 1000
    }, sync.defer()));
  } catch (e) {
    res.status(500).send('Error');
    return;
  }

  if (response.statusCode !== 200 || !response.body || !response.body.data) {
    res.status(500).send('Error');
    return;
  }

  // Show only the Title of the reddit posts in the Typeahaed, so we don't overcrowd with too much information.
  var results = _.chain(response.body.data.children)
    .reject(function(post) {
      return !post || !post.data || !post.data.title || !post.data.id;
    })
    .map(function(post) {
      return {
        title: post.data.title,
        text: 'http://www.reddit.com/' + post.data.id
      };
    })
    .value();

  if (results.length === 0) {
    res.json([{
      title: '<i>(no results)</i>',
      text: ''
    }]);
  } else {
    res.json(results);
  }
};

