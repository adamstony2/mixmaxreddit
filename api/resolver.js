var key = require('../utils/key');
var sync = require('synchronize');
var request = require('request');
var _ = require('underscore');

// The API that returns the in-email representation.
module.exports = function(req, res) {
  var term = req.query.text.trim();

  
  if (/^http:\/\/www\.reddit\.com\/\S+/.test(term)) {
    // Special-case: handle strings in the special URL form that are suggested by the /typeahead
    // API.
    handleIdString(term, req, res);
  } else {
    // Else, if the user was typing fast and press enter before the /typeahead API can respond,
    // Mixmax will just send the text to the /resolver API (for performance). Handle that here.
    handleSearchString(term, req, res);
  }
};

function handleIdString(id, req, res) {
  var response;
  try {
    response = sync.await(request({
      url: id + '.json',
      gzip: true,
      json: true,
      timeout: 15 * 1000
    }, sync.defer()));
  } catch (e) {
    res.status(500).send('Error');
    return;
  }
  
  if (!response || !response.body || !response.body[0].data || !response.body[0].data.children)
  {
    // We did not get the correct response back, return an error
    res.status(500).send('Error');
    return
  }
  
  res.json({
    body: createHtml(response.body[0].data.children[0]),
    // Add raw:true if you're returning content that you want the user to be able to edit
  });
}

function handleSearchString(term, req, res) {
  // Here, we just select the very first post from the subreddit page
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
  
  if (!response || !response.body || !response.body.data || !response.body.data.children)
  {
    // We did not get the correct response back, return an error
    res.status(500).send('Error');
    return;
  }
  
  res.json({
    body: createHtml(response.body.data.children[0])
    // Add raw:true if you're returning content that you want the user to be able to edit
  });
}

function createHtml(post)
{
  // Create a representation of the reddit post, displaying the Title, Auther and Image if one exists.
  var imageUrl = post.data.thumbnail == 'self' || post.data.thumbnail == 'default' ? '' : '<img style="float:left;width:auto;height:100px;" src="' + post.data.thumbnail + '" />'
  var html = imageUrl + '<a href="http://www.reddit.com' + post.data.permalink + '">' + post.data.title + '</a></br> posted by ' + post.data.author;
  return html;
}