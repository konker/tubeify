/**
  tubeify.js
  Authors: Konrad Markus <konker@gmail.com>

  TODO:
    - custom audio controls:
        - play/pause
        - back/prev
        - end/next
        - seek bar
        - volume controls
    - readystate capturing
    - loading/status visuals
    - search results
        - paging
        - is there metadata about artist?
            - click to search for artist?
    - playlists
        - add song to playlist
        - save playlist in localStorage
        - create actual youtube playlists?

    - cue song?
        - 'default' playlist of now playing/cued songs?

    - history?
    - saved searches?
    - register?
        - playlists, history, saved searches
    - login to youtube?
        - ratings, comments

    - amends for this to work on mobile?
        - html5 iframe player api?

    - show video option?
*/

var tubeify = (function() {
    var GDATA_BASE = 'http://gdata.youtube.com/feeds/api/videos?strict=true',
        MUSICBRAINZ_BASE = 'http://musicbrainz.org/ws/2/',
        VIDEO_HEIGHT = 1,
        VIDEO_WIDTH = 1;

    return {
        init: function() {
            $('#go').bind('click', tubeify.search.metadata.exec);
            $('#q').bind('keyup', function(e) {
                if(e.keyCode == 13){
                    tubeify.search.metadata.exec();
                };
            });
            $('#controls .play').bind('click', tubeify.controls.play);
            $('#controls .pause').bind('click', tubeify.controls.pause);
            $('#controls .stop').bind('click', tubeify.controls.stop);
            $('#controls .vol-down').bind('click', tubeify.controls.volDown);
            $('#controls .vol-up').bind('click', tubeify.controls.volUp);
            tubeify.player.init();
        },
        player: {
            player: null,
            apiready: false,

            init: function() {
                swfobject.embedSWF(
                    "http://www.youtube.com/apiplayer?" +
                    "version=3&enablejsapi=1&playerapiid=player1",
                    "tubeify-player-container",
                    VIDEO_WIDTH, VIDEO_HEIGHT,
                    "9", null, null,
                    { allowScriptAccess: 'always' },
                    { id: 'tubeify-player' }
                );
                console.log('INIT');
            },
            create: function(id) {
                console.log(id);
                console.log(tubeify.player.player);
                tubeify.player.player.cueVideoById(id);
                tubeify.player.player.playVideo();

                /*
                console.log(tubeify.player.onPlayerReady);
                tubeify.player.player = new YT.Player('tubeify-player', {
                    height: VIDEO_HEIGHT,
                    width: VIDEO_WIDTH,
                    videoId: id,
                    playerVars: { 'autoplay': 0, 'controls': 0 },
                    events: {
                        'onReady': tubeify.player.onPlayerReady,
                        'onStateChange': tubeify.player.onPlayerStateChange,
                        'onError': tubeify.player.onPlayerError
                    }
                });
                console.log(tubeify.player.player);
                */
            },
            onPlayerReady: function(e) {
                console.log(e);
                console.log('READY');
                console.log(tubeify.player.player);
            },
            onPlayerStateChange: function(e) {
                console.log(e);
            },
            onPlayerError: function(e) {
                console.log(e);
            }
        },
        controls: {
            isPlaying: false,

            play: function() {
                if (tubeify.controls.isPlaying) {
                    tubeify.player.player.pauseVideo();
                    tubeify.controls.isPlaying = false;
                    $('#controls .pause').removeClass('pause').addClass('play');
                }
                else {
                    tubeify.player.player.playVideo();
                    tubeify.controls.isPlaying = true;
                    $('#controls .play').removeClass('play').addClass('pause');
                }
            },
            pause: function() {
                tubeify.player.player.pauseVideo();
            },
            stop: function() {
                tubeify.player.player.stopVideo();
            },
            volDown: function() {
                tubeify.player.player.setVolume(tubeify.player.player.getVolume() - 10);
            },
            volUp: function() {
                tubeify.player.player.setVolume(tubeify.player.player.getVolume() + 10);
            }
        },
        loading: {
            on: function() {
                $('#loading img').show();
            },
            off: function() {
                $('#loading img').hide();
            },
        },
        search: {
            metadata: {
                exec: function(query, type) {
                    tubeify.loading.on();
                    console.log(typeof(query) + ':' + typeof(type));
                    if (typeof(query) != 'string') {
                        query = $('#q').val();
                    }
                    if (typeof(type) == 'undefined') {
                        type = $('input:radio[name=search-type]:checked').val();
                    }

                    console.log(query + ':' + type);
                    var url = MUSICBRAINZ_BASE;
                    switch(type) {
                        case 'artist':
                            url += 'artist';
                            url += '?query=' + query;
                            break;
                        case 'artist_id':
                            url += 'artist/' + query;
                            url += '?inc=release-groups';
                            break;
                        case 'song':
                        default:
                            url += 'release';
                            url += '?query=' + query;
                            break;
                    }

                    console.log(url);
                    $.ajax({
                        type: 'GET',
                        url: url,
                        dataType: 'xml',
                        async: true,
                        success: tubeify.search.metadata[type].result,
                        error: tubeify.search.metadata.error,
                    });
                },
                artist_id: {
                    result: function(data) {
                        console.log(data);
                        data = $(data);

                        $('#search-results ul li').remove();
                        var artist_name = data.find('artist > name').text();

                        data.find('release-group[type=Single]').each(function() {
                            var item = $(this);
                            var s = '<span class="title" data-artist="' + artist_name + '">' + item.find('title').text() + '</span>';
                            $('#search-results ul').append('<li id="' + item.attr('id') + '">' + s + '</li>');
                        });
                        $('#search-results ul li').each(function() {
                            var item = $(this);
                            item.bind('click', function(e) {
                                tubeify.search.video.exec(item.find('.title').attr('data-artist') + ' ' + item.find('.title').text(), 'title_artist', item.attr('id'));
                            });
                        });
                        tubeify.loading.off();
                    }
                },
                song: {
                    result: function(data) {
                        console.log(data);

                        data = $(data);
                        $('#search-results ul li').remove();
                        data.find('release').each(function() {
                            var item = $(this);
                            var s = '<span class="title">' + item.find('title').text() + '</span>';
                            var name_credits = item.find('artist-credit > name-credit');
                            if (name_credits.length > 1) {
                            
                                name_credits.each(function() {
                                    var subitem = $(this);
                                    s += '<span class="artist" id="' + subitem.find('artist').attr('id') +'">' + subitem.find('artist > name').text() + '</span>';
                                    if (subitem.attr('joinphrase')) {
                                        s += subitem.attr('joinphrase');
                                    }
                                });
                            }
                            else {
                                s += '<span class="artist" id="' + name_credits.find('artist').attr('id') + '">' + name_credits.find('artist > name').text() + '</span>';
                            }
                            $('#search-results ul').append('<li id="' + item.attr('id') + '">' + s + '</li>');
                        });
                        $('#search-results ul li').each(function() {
                            var item = $(this);
                            item.find('.title').bind('click', function(e) {
                                tubeify.search.metadata.exec(item.attr('id'), 'release-id');
                            });
                            item.find('.artist').bind('click', function(e) {
                                tubeify.search.metadata.exec(e.target.id, 'artist_id');
                            });
                        });

                        tubeify.loading.off();
                    }
                },
                artist: {
                    result: function(data) {
                        console.log(data);

                        data = $(data);
                        $('#search-results ul li').remove();
                        data.find('artist').each(function() {
                            var item = $(this);
                            var s = '<span class="name">' + item.find('name').text() + '</span>';
                               s += '<span class="disambiguation">' + item.find('disambiguation').text() + '</span>';
                            $('#search-results ul').append('<li id="' + item.attr('id') + '">' + s + '</li>');
                        });
                        $('#search-results ul li').each(function() {
                            var item = $(this);
                            item.bind('click', function(e) {
                                tubeify.search.metadata.exec(item.attr('id'), 'artist_id');
                            });
                        });

                        tubeify.loading.off();
                    }
                },
                error: function(xhr, type) {
                    alert(type);
                }
            },
            video: {
                exec: function(query, type, targetId) {
                    tubeify.loading.on();
                    if (typeof(query) != 'string') {
                        query = $('#q').val();
                    }

                    var url = GDATA_BASE +
                        '&alt=json' + 
                        '&max-results=5' +
                        '&q=' + query

                    console.log(url);
                    $.ajax({
                        type: 'GET',
                        url: url,
                        dataType: 'json',
                        async: true,
                        success: function(data) {
                            tubeify.search.video.result(data, targetId);
                        },
                        error: tubeify.search.video.error,
                    });
                },
                result: function(data, targetId) {
                    console.log(data);
                    var result = $('<ul class="video-results"></ul>');
                    for (var i in data.feed.entry) {
                        result.append('<li id="' + data.feed.entry[i].id.$t + '">' + data.feed.entry[i].title.$t + '</li>');
                    }
                    result.find('li').bind('click', function(e) {
                        tubeify.player.create(tubeify.util.getId(e.target.id));
                    });
                    $('#' + targetId + ' .video-results').remove();
                    $('#' + targetId).append(result);

                    // play the first result
                    tubeify.player.create(tubeify.util.getId(data.feed.entry[0].id.$t));

                    tubeify.loading.off();
                },
                result2: function(data) {
                    console.log(data);
                    $('#search-results ul li').remove();
                    for (var i in data.feed.entry) {
                        $('#search-results ul').append('<li id="' + data.feed.entry[i].id.$t + '">' + data.feed.entry[i].title.$t + '</li>');
                    }
                    $('#search-results ul li').bind('click', function(e) {
                        tubeify.player.create(tubeify.util.getId(e.target.id));
                    });
                    tubeify.loading.off();
                },
                error: function(xhr, type) {
                    alert(type);
                }
            }
        },
        util: {
            getId: function(id) {
                return id.substr(id.lastIndexOf('/')+1);
            }
        }
    }
})();

function onYouTubePlayerReady(playerId) {
    tubeify.player.player = document.getElementById('tubeify-player');
    tubeify.player.player.addEventListener('onReady', tubeify.player.onPlayerReady);
    tubeify.player.player.addEventListener('onStateChange', tubeify.player.onPlayerStateChange);
    tubeify.player.player.addEventListener('onError', tubeify.player.onPlayerError);

    tubeify.player.apiready = true;
    console.log('API_READY: ' + playerId);
}

$(document).ready(function() {
    tubeify.init();
});
