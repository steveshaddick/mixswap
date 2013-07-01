var GLOBAL = {
	csrfToken : ''
};

function csrfSafeMethod(method) {
	// these HTTP methods do not require CSRF protection
	return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

var AudioPlayer = {
	
	$audioPlayer: false,
	$container: false,
	isReady: false,
	readySong: false,
	readyPlay: false,

	init: function() {
		var that = this;

		this.$audioPlayer = $("#jquery_jplayer_1");
		this.$container = $("#jp_container_1");

		this.$audioPlayer.jPlayer({	
			ready: function() {
				that.isReady = true;
				if (that.readySong) {
					AudioPlayer.play(that.readySong, that.readyPlay);
				}
			},
			ended: function() {
				EventDispatcher.dispatchEvent('songEnded');
			},
			pause: function() {
				EventDispatcher.dispatchEvent('songStop');
			},
			preload: "auto",
			swfPath: "/js"
		});

		EventDispatcher.addEventListener('songPlay', function(obj){ that.play(obj.song, obj.autoPlay); });
	},

	play: function(song, autoPlay) {
		if (typeof autoPlay == "undefined") {
			autoPlay = true;
		}
		if (!this.isReady) {
			this.readySong = song;
			this.readyPlay = autoPlay;
			return;
		}
		var file = song.attributes.songFile;
		var ext = file.substr(file.lastIndexOf('.') + 1);

		var mediaObj = {};
		mediaObj[ext] = file;

		this.$audioPlayer.jPlayer("setMedia", mediaObj);
		if (autoPlay) {
			this.$audioPlayer.jPlayer("play");
		}

		$('.jp-title', this.$container).html(song.attributes.title);

		this.readySong = false;
	}
};

var App = {

	init: function(data) {

		GLOBAL.csrfToken = Cookie.get('csrftoken');

		$.ajaxSetup({
			crossDomain: false,
			beforeSend: function(xhr, settings) {
				if (!csrfSafeMethod(settings.type)) {
					xhr.setRequestHeader("X-CSRFToken", GLOBAL.csrfToken);
				}
			}
		});

		$.fn.editable.defaults.mode = 'inline';

		var oldSync = Backbone.sync;
		Backbone.sync = function(method, model, options) {
			options.beforeSend = function(xhr){
				xhr.setRequestHeader('X-CSRFToken', GLOBAL.csrfToken);
			};
			return oldSync(method, model, options);
		};
		Backbone.emulateHTTP = true;

		this.mixView = new MixView({
			model: new Mix(data),
			el: $("#mix")[0],
			id: data.id,
			isUserMix: data.isUserMix,
			isPublished: data.isPublished,
			pictureFile: data.pictureFile
		});

		AudioPlayer.init();
		this.mixView.renderInit();

	}


};