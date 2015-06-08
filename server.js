#!/usr/bin/env node

var fs = require('fs');
var http = require('http');
var path = require('path');

var accesslog = require('access-log');
var marked = require('marked');

var host = '0.0.0.0';
var port = 8080;

http.createServer(onrequest).listen(port, host, listening);

function listening() {
  console.log('web server is listening on http://%s:%d', host, port);
}

function onrequest(req, res) {
  accesslog(req, res);
  //console.log('%s %s', req.method, req.url);

  if (req.url === '/') {
    fs.readdir('./posts', function(err, d) {
      if (err) {
        res.statusCode = 500;
        res.end();
        return;
      }

      var html = '<ul>\n';
      d.sort().reverse().forEach(function(file) {
        var post = path.basename(file, '.md');
        html += '<li>' + post.link('/post/' + post) + '</li>\n';
      });
      html += '</ul>\n';

      template(html, function(err, body) {
        if (err) {
          res.statusCode = 500;
          res.end();
          return;
        }

        res.end(body);
      });
    });
    return;
  }

  var parts = req.url.split('/').slice(1);

  if (parts[0] === 'post') {
    var file = parts[1] + '.md';

    fs.readFile('./posts/' + file, 'utf8', function(err, s) {
      if (err) {
        res.statusCode = err.code === 'ENOENT' ? 404 : 500;
        res.end(err.message);
        return;
      }

      console.dir(s);

      template(marked(s), function(err, body) {
        if (err) {
          res.statusCode = 500;
          res.end();
          return;
        }

        res.end(body);
      });
    });

    return;
  }
}

function template(html, cb) {
  fs.readFile('./index.html', 'utf8', function(err, s) {
    if (err)
      cb(err);

    cb(null, s.replace('<!-- CONTENT -->', html));
  });
}
