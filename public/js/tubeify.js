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
        VIDEO_HEIGHT = 10,
        VIDEO_WIDTH = 20;

    return {
        init: function() {
            $('#go').bind('click', tubeify.search.exec);
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
                tubeify.player.player = document.getElementById('tubeify-player');
                tubeify.player.apiready = true;
            },
            create: function(id) {
                console.log(id);
                console.log(tubeify.player.player);
                tubeify.player.player.cueVideoById(id);
                //var url = 'http://www.youtube.com/apiplayer?version=3&video_id=' + id;
                var url = 'http://www.youtube.com/v/' + id + '?version=3';
                //$('#player embed').attr('src', url);
                //$('#player param[name="movie"]').attr('value', url);

                /*
                tubeify.player.player = new YT.Player('player', {
                    height: VIDEO_HEIGHT,
                    width: VIDEO_WIDTH,
                    videoId: id,
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange
                    }
                });
                */
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
        search: {
            exec: function() {
                var url = GDATA_BASE  +
                    '&alt=json-in-script' + 
                    '&callback=tubeify.search.result' +
                    '&q=' + $('#q').val();

                console.log(url);
                $('#data').attr('src', url);
            },
            result: function(data) {
                console.log(data);
                for (var i in data.feed.entry) {
                    $('#search-results ul').append('<li id="' + data.feed.entry[i].id.$t + '">' + data.feed.entry[i].title.$t + '</li>');
                }
                $('#search-results ul li').bind('click', function(e) {
                    tubeify.player.create(tubeify.util.getId(e.target.id));
                });
            }
        },
        util: {
            getId: function(id) {
                return id.substr(id.lastIndexOf('/')+1);
            }
        }
    }
})();

function onYouTubePlayerAPIReady() {
    tubeify.player.apiready = true;
    tubeify.player.player = document.getElementById('tubeify-player');
    alert(tubeify.player.player);
}

$(document).ready(function() {
    tubeify.init();
});
