// Generated by CoffeeScript 1.6.3
(function() {
  'use strict';
  var Cookie, Headers, accountLogout, addId3v23, cheerio, downloadAlbumCover, downloadMusic, execPath, fs, getAccountInfo, getAlbumInfo, getCookie, getInfo, getLocation, getLoginForm, getShowcollectInfo, getSongInfo, http, id3v23, log, mixins, parseString, parseXMLData, path, request, safeFilter, str2bool, timers,
    __slice = [].slice;

  http = require('http');

  fs = require('fs');

  path = require('path');

  timers = require('timers');

  request = require('request');

  parseString = require('xml2js').parseString;

  cheerio = require('cheerio');

  id3v23 = require('./id3v2').id3v23;

  execPath = path.dirname(process.execPath);

  Headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.8',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'Host': 'www.xiami.com',
    'Origin': 'http://www.xiami.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36 AlexaToolbar/alxg-3.1'
  };

  safeFilter = function(str) {
    var removeSpan, safeFilename;
    removeSpan = function(str) {
      return str.replace('<span>', ' ').replace('</span>', '');
    };
    safeFilename = function(str) {
      return str.replace(/(\/|\\|\:|\*|\?|\"|\<|\>|\||\s+)/g, ' ');
    };
    return safeFilename(removeSpan(str));
  };

  Cookie = '';

  log = function(data, cb) {
    return fs.appendFile('XiamiThief.log', "[" + (Date()) + "]" + data, function() {
      if (typeof cb === 'function') {
        return cb();
      }
    });
  };

  request = request.defaults({
    jar: true,
    headers: Headers,
    followAllRedirects: true,
    strictSSL: false,
    proxy: false
  });

  mixins = function() {
    var args, key, obj, result, value, _i, _len;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    result = {};
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      obj = args[_i];
      for (key in obj) {
        value = obj[key];
        result[key] = value;
      }
    }
    return result;
  };

  str2bool = function(str, def) {
    if (str === 'true') {
      return true;
    } else if (str === 'false') {
      return false;
    } else {
      return def != null ? def : false;
    }
  };

  addId3v23 = function(info) {
    var picture, writer;
    writer = new id3v23(info.savePath);
    writer.setTag('TALB', info.album.name);
    writer.setTag('TPE1', info.artist.name);
    writer.setTag('TIT2', info.song.name);
    if (info.trackId) {
      writer.setTag('TRCK', info.trackId.toString());
    }
    if (info.year) {
      writer.setTag('TYER', info.year);
    }
    picture = path.resolve(path.dirname(info.savePath), 'small.jpg');
    if (fs.existsSync(picture)) {
      writer.setTag('APIC', fs.readFileSync(picture));
    }
    return writer;
  };

  getLocation = function(str) {
    var a1, a2, a3, a4, a5, a5_0_length, a5_length, a6, a7, a7_length, a8, e, i, j;
    try {
      a1 = parseInt(str.charAt(0));
      a2 = str.substring(1);
      a3 = Math.floor(a2.length / a1);
      a4 = a2.length % a1;
      a5 = [];
      a6 = 0;
      a7 = "";
      a8 = "";
      while (a6 < a4) {
        a5[a6] = a2.substr((a3 + 1) * a6, a3 + 1);
        ++a6;
      }
      while (a6 < a1) {
        a5[a6] = a2.substr(a3 * (a6 - a4) + (a3 + 1) * a4, a3);
        ++a6;
      }
      i = 0;
      a5_0_length = a5[0].length;
      while (i < a5_0_length) {
        j = 0;
        a5_length = a5.length;
        while (j < a5_length) {
          a7 += a5[j].charAt(i);
          ++j;
        }
        ++i;
      }
      a7 = decodeURIComponent(a7);
      i = 0;
      a7_length = a7.length;
      while (i < a7_length) {
        a8 += (a7.charAt(i) === "^" ? "0" : a7.charAt(i));
        ++i;
      }
      return a8;
    } catch (_error) {
      e = _error;
      return false;
    }
  };

  parseXMLData = function(rawXML, cb) {
    return parseString(rawXML, {
      ignoreAttrs: true,
      explicitArray: false
    }, function(err, result) {
      var albumId, albumName, artistId, artistName, data, lyricUrl, pictureUrl, songId, songName, track, trackList, _i, _len, _ref, _ref1;
      if (!err) {
        trackList = result.playlist.trackList.track;
        if (!trackList.push) {
          trackList = [trackList];
        }
        data = [];
        for (_i = 0, _len = trackList.length; _i < _len; _i++) {
          track = trackList[_i];
          songId = track.song_id;
          songName = track.title;
          albumId = (_ref = track.albumId) != null ? _ref : track.album_id;
          albumName = track.album_name;
          artistName = track.artist;
          artistId = track.artist_id;
          lyricUrl = track.lyric;
          pictureUrl = (_ref1 = track.pic) != null ? _ref1.replace(/_\d/, '') : void 0;
          data.push({
            'song': {
              'name': songName,
              'id': songId
            },
            'album': {
              'name': albumName,
              'id': albumId
            },
            'artist': {
              'name': artistName,
              'id': artistId
            },
            'lyric': {
              'url': lyricUrl
            },
            'picture': {
              'url': pictureUrl
            }
          });
        }
        return cb(data);
      } else {
        throw new Error(err);
      }
    });
  };

  getSongInfo = function(id, cb) {
    return request("http://www.xiami.com/song/playlist/id/" + id + "/type/0", function(error, response, body) {
      if (!error && response.statusCode === 200) {
        return parseXMLData(body, function(data) {
          return cb(data.length === 1 ? data[0] : data);
        });
      } else {
        return cb(false);
      }
    });
  };

  getAlbumInfo = function(id, cb) {
    return request("http://www.xiami.com/album/" + id, function(error, response, body) {
      var $, artistInfo, companyInfo, info, languageInfo, name, pictureUrl, styleInfo, timeInfo, typeInfo, _ref;
      if (!error && response.statusCode === 200) {
        $ = cheerio.load(body, {
          ignoreWhitespace: true
        });
        name = $('#title h1').text();
        pictureUrl = (_ref = $('#album_cover a img').attr('src')) != null ? _ref.replace(/_\d/, '') : void 0;
        info = $('#album_info table tr').toArray();
        artistInfo = $(info[0]).children().last().text();
        languageInfo = $(info[1]).children().last().text();
        companyInfo = $(info[2]).children().last().text();
        timeInfo = $(info[3]).children().last().text();
        typeInfo = $(info[4]).children().last().text();
        styleInfo = $(info[5]).children().last().text();
        return request("http://www.xiami.com/song/playlist/id/" + id + "/type/1", function(error, response, body) {
          if (!error && response.statusCode === 200) {
            return parseXMLData(body, function(data) {
              var i, song, _i, _j, _len, _len1, _ref1;
              if (data[0].album.id == null) {
                for (_i = 0, _len = data.length; _i < _len; _i++) {
                  i = data[_i];
                  i.album.id = id;
                }
              }
              info = {
                'data': data,
                'name': name,
                'artist': artistInfo,
                'language': languageInfo,
                'company': companyInfo,
                'time': timeInfo,
                'style': styleInfo,
                'type': 'album',
                'year': timeInfo.substring(0, 4),
                'picture': data[0].picture
              };
              _ref1 = info.data;
              for (id = _j = 0, _len1 = _ref1.length; _j < _len1; id = ++_j) {
                song = _ref1[id];
                song.trackId = id + 1;
                if (info.year) {
                  song.year = info.year;
                }
              }
              return cb(info);
            });
          } else {
            return cb(false);
          }
        });
      } else {
        return cb(false);
      }
    });
  };

  getShowcollectInfo = function(id, cb) {
    return request("http://www.xiami.com/song/showcollect/id/" + id, function(error, response, body) {
      var $, name, pictureUrl, _ref;
      if (!error && response.statusCode === 200) {
        $ = cheerio.load(body, {
          ignoreWhitespace: true
        });
        name = $('#xiami-content h1').text();
        pictureUrl = (_ref = $('#cover_logo a img').attr('src')) != null ? _ref.replace(/_\d/, '') : void 0;
        return request("http://www.xiami.com/song/playlist/id/" + id + "/type/3", function(error, response, body) {
          if (!error && response.statusCode === 200) {
            return parseXMLData(body, function(data) {
              return cb({
                'data': data,
                'name': name,
                'pictureUrl': pictureUrl,
                'type': 'showcollect'
              });
            });
          } else {
            return cb(false);
          }
        });
      } else {
        return cb(false);
      }
    });
  };

  downloadMusic = function(info, cb, useId3, useLyric, client) {
    var download, filename;
    filename = {
      music: info.savePath,
      lyric: info.savePath.replace('.mp3', '.lrc'),
      picture: path.resolve(path.dirname(info.savePath), info.album.name + '.jpg')
    };
    download = function(location) {
      if (location) {
        return fs.exists(filename.music, function(exists) {
          var req;
          return req = http.get(location, function(res) {
            var contentLength, save, size, writer;
            if (res.statusCode === 302) {
              download(res.headers.location);
              return;
            }
            writer = addId3v23(info);
            save = function() {
              var check, count, f, lastBytes;
              f = fs.createWriteStream(filename.music);
              f.on('finish', function() {
                if (f.bytesWritten === contentLength) {
                  if (useId3 && writer) {
                    return writer.write(function() {
                      /*
                      if info.last
                          fs.unlinkSync(picture) # 最后一个音乐时清除small.jpg
                      */

                      return cb(true);
                    });
                  } else {
                    return cb(true);
                  }
                } else {
                  return cb(false);
                }
              });
              f.on('error', function(err) {
                f.end();
                cb(false);
                throw err;
              });
              res.pipe(f);
              lastBytes = 0;
              count = 0;
              check = function(timeout) {
                var downloadProgress, nowBytes;
                nowBytes = f.bytesWritten;
                downloadProgress = nowBytes / contentLength;
                if (downloadProgress >= 1) {
                  return f.end();
                } else {
                  if (lastBytes === nowBytes) {
                    count++;
                  } else {
                    count = 0;
                  }
                  if (count > 60) {
                    return f.end();
                  } else {
                    cb(downloadProgress);
                    return timers.setTimeout(check, timeout * 1000);
                  }
                }
              };
              return check(1);
            };
            contentLength = parseInt(res.headers['content-length']);
            if (exists) {
              size = fs.statSync(filename.music).size;
              if (useId3) {
                size -= writer.getSize();
              }
              if (size >= contentLength) {
                cb(true);
                return req.abort();
              } else {
                return save();
              }
            } else {
              return save();
            }
          }).on('error', function(err) {
            cb(false);
            throw err;
          });
        });
      } else {
        return cb(false);
      }
    };
    if (!client) {
      request({
        url: "http://www.xiami.com/song/gethqsong/sid/" + info.song.id,
        json: 'body',
        jar: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': Cookie
        }
      }, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          return download(getLocation(body.location));
        } else {
          return cb(false);
        }
      });
    } else {
      client.getUrl(info.song.id, function(result, args, output, warning) {
        if (isNaN(result)) {
          return download(result);
        } else {
          return cb(false);
        }
      });
    }
    if (useLyric && info.lyric.url.indexOf('.lrc') >= 0) {
      return fs.exists(filename.lyric, function(exists) {
        var f;
        if (!exists) {
          f = fs.createWriteStream(filename.lyric);
          return request(info.lyric.url, {
            jar: false,
            headers: {}
          }).pipe(f);
        }
      });
    }
  };

  downloadAlbumCover = function(info, cb, useCover, useId3) {
    var count, savePath, tempSavePath, total;
    total = 0;
    if (useCover) {
      total++;
    }
    if (useId3) {
      total++;
    }
    if (total === 0) {
      return cb(true);
    } else {
      count = 0;
      if (useCover) {
        savePath = path.resolve(info.savePath, safeFilter("" + info.name + ".jpg"));
        fs.exists(savePath, function(exists) {
          var f;
          if (!exists) {
            f = fs.createWriteStream(savePath);
            f.on('finish', function() {
              count++;
              if (count === total) {
                return cb(true);
              }
            });
            return request(info.picture.url, {
              jar: false,
              headers: {}
            }).pipe(f);
          } else {
            count++;
            if (count === total) {
              return cb(true);
            }
          }
        });
      }
      if (useId3) {
        tempSavePath = path.resolve(info.savePath, safeFilter('small.jpg'));
        return fs.exists(tempSavePath, function(exists) {
          var f;
          if (!exists) {
            f = fs.createWriteStream(tempSavePath);
            f.on('finish', function() {
              count++;
              if (count === total) {
                return cb(true);
              }
            });
            return request(info.picture.url.replace('.jpg', '_5.jpg'), {
              jar: false,
              headers: {}
            }).pipe(f);
          } else {
            count++;
            if (count === total) {
              return cb(true);
            }
          }
        });
      }
    }
  };

  getLoginForm = function(cb) {
    return request('http://www.xiami.com/member/login', function(error, response, body) {
      var $, data, field, fields, img, name, value, _i, _len, _ref, _ref1;
      if (!error && response.statusCode === 200) {
        $ = cheerio.load(body, {
          ignoreWhitespace: true
        });
        fields = $('form input').toArray();
        data = {};
        for (_i = 0, _len = fields.length; _i < _len; _i++) {
          field = fields[_i];
          name = (_ref = $(field).attr('name')) != null ? _ref : '';
          value = (_ref1 = $(field).attr('value')) != null ? _ref1 : '';
          data[name] = value;
        }
        if (data.validate != null) {
          img = fs.createWriteStream('validate.png');
          img.on('finish', function() {
            return cb(data);
          });
          return request("https://login.xiami.com/coop/checkcode?forlogin=1&t=" + (Math.random())).pipe(img);
        } else {
          return cb(data);
        }
      }
    });
  };

  getCookie = function(data, cb) {
    return request.post('http://www.xiami.com/member/login', {
      form: data,
      headers: mixins(Headers, {
        'Referer': 'http://www.xiami.com/member/login',
        'Host': 'www.xiami.com',
        'Origin': 'http://www.xiami.com'
      })
    }, function(error, response, body) {
      var cookie, _ref;
      if (fs.existsSync('validate.png')) {
        fs.unlinkSync('validate.png');
      }
      if (!error) {
        cookie = (_ref = response.headers['set-cookie']) != null ? _ref.toString() : void 0;
        if (cookie) {
          Cookie = cookie;
          return cb(Cookie);
        } else {
          return cb(false);
        }
      } else {
        return cb(false);
      }
    });
  };

  getAccountInfo = function(cb) {
    return request("http://www.xiami.com/song/playlist/id/1/type/0", {
      headers: {
        'Cookie': Cookie
      }
    }, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        return parseString(body, {
          ignoreAttrs: true,
          explicitArray: false
        }, function(err, result) {
          if (!err) {
            delete result.playlist.trackList;
            return cb(result.playlist);
          }
        });
      }
    });
  };

  accountLogout = function(cb) {
    return request('http://www.xiami.com/member/logout', {
      headers: {
        'Cookie': Cookie
      }
    }, function(error, response, body) {
      Cookie = '';
      return typeof cb === "function" ? cb(true) : void 0;
    });
  };

  getInfo = function(url, cb) {
    var album, isAlbum, isShowcollect, isSong, showcollect, song;
    isSong = /www.xiami.com\/song\/(\d+)/;
    isShowcollect = /www.xiami.com\/song\/showcollect\/id\/(\d+)/;
    isAlbum = /www.xiami.com\/album\/(\d+)/;
    song = isSong.exec(url);
    showcollect = isShowcollect.exec(url);
    album = isAlbum.exec(url);
    if (song) {
      return getSongInfo(song[1], cb);
    } else if (showcollect) {
      return getShowcollectInfo(showcollect[1], cb);
    } else if (album) {
      return getAlbumInfo(album[1], cb);
    }
  };

  exports.getShowcollectInfo = getShowcollectInfo;

  exports.getAlbumInfo = getAlbumInfo;

  exports.getSongInfo = getSongInfo;

  exports.getAccountInfo = getAccountInfo;

  exports.downloadMusic = downloadMusic;

  exports.downloadAlbumCover = downloadAlbumCover;

  exports.getCookie = getCookie;

  exports.getLoginForm = getLoginForm;

  exports.accountLogout = accountLogout;

  exports.getInfo = getInfo;

  exports.execPath = execPath;

  exports.id3v23 = id3v23;

  exports.log = log;

  exports.str2bool = str2bool;

}).call(this);
