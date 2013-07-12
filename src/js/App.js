var GLOBAL = {
	csrfToken : ''
};

function csrfSafeMethod(method) {
	// these HTTP methods do not require CSRF protection
	return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

var Modal = {

	$modalWrapper: false,

	open: function(url, clickHandler) {
		if (this.$modalWrapper) {
			Modal.close();
		}
		var that = this;

		if (typeof clickHandler == "undefined") {
			clickHandler = false;
		}
		this.$modalWrapper = $("#modalWrapper");
		this.$modalWrapper.css('display', 'table');
		$('td', this.$modalWrapper).html('<div class="loading">Loading ...</div>').load(url, function() {
			if (clickHandler) {
				that.$modalWrapper.on('click', 'a', clickHandler);
			}
		});
	},


	close: function() {
		if (!this.$modalWrapper) return;

		$('td', this.$modalWrapper).html('');
		this.$modalWrapper.css('display', '').off('click');
		this.$modalWrapper = false;
	}
};

var AudioPlayer = {
	
	$audioPlayer1: false,
	$audioPlayer2: false,
	$container: false,
	isReady: false,
	readySong1: false,
	readySong2: false,
	readyPreload: false,
	readyPlay: false,
	preloadTimeout:false,

	init: function() {
		var that = this;

		this.$audioPlayer1 = $("#jquery_jplayer_1");
		this.$audioPlayer2 = $("#jquery_jplayer_2");
		this.$container = $("#jp_container_1");

		this.$audioPlayer1.jPlayer({	
			ready: function() {
				that.isReady = true;
				if (that.readySong1) {
					AudioPlayer.play(that.readySong1, that.readyPreload, that.readyPlay);
				}
			},
			ended: function() {
				EventDispatcher.dispatchEvent('songEnded');
			},
			pause: function() {
				EventDispatcher.dispatchEvent('songStop');
			},
			preload: "auto",
			swfPath: "/js",
			supplied: "mp3,m4a",
			cssSelectorAncestor: "#jp_container_1"
		});

		/*this.$audioPlayer2.jPlayer({	
			ready: function() {
				that.isReady = true;
				if (that.readySong2) {
					AudioPlayer.play(that.readySong2, that.readyPreload, that.readyPlay);
				}
			},
			ended: function() {
				EventDispatcher.dispatchEvent('songEnded');
			},
			pause: function() {
				EventDispatcher.dispatchEvent('songStop');
			},
			preload: "auto",
			swfPath: "/js",
			supplied: "mp3,m4a",
			cssSelectorAncestor: "#jp_container_2"
		});*/

		EventDispatcher.addEventListener('songPlay', function(obj){ that.play(obj.song, obj.preloadSong, obj.autoPlay); });
	},

	play: function(song, preloadSong, autoPlay) {
		if (typeof autoPlay == "undefined") {
			autoPlay = true;
		}
		var isOdd = (song.attributes.songOrder % 2) === 1;
		isOdd = 1;

		if (!this.isReady) {
			this.readyPlay = autoPlay;
			if (isOdd) {
				this.readySong1 = song;
			} else {
				this.readySong2 = song;
			}
			this.readyPreload = preloadSong;
			return;
		}

		var player = (isOdd) ? this.$audioPlayer1 : this.$audioPlayer2;
		var file = song.attributes.songFile;
		var ext = file.substr(file.lastIndexOf('.') + 1);
		var mediaObj = {};
		mediaObj[ext] = file;

		/*this.$audioPlayer1.jPlayer("pause").jPlayer("option", "cssSelectorAncestor", "");
		this.$audioPlayer2.jPlayer("pause").jPlayer("option", "cssSelectorAncestor", "");

		player.jPlayer("option", "cssSelectorAncestor", "#jp_container_1").jPlayer("setMedia", mediaObj);*/
		player.jPlayer("setMedia", mediaObj);
		if (autoPlay) {
			player.jPlayer("play");
		}
		$('.jp-title', this.$container).html(song.attributes.title);

		/*var preloader;
		if (this.preloadTimeout) {
			clearTimeout(this.preloadTimeout);
			this.preloadTimeout = false;
		}
		if (preloadSong) {
			preloader = (isOdd) ? this.$audioPlayer2 : this.$audioPlayer1;
			file = preloadSong.attributes.songFile;
			ext = file.substr(file.lastIndexOf('.') + 1);

			mediaObj = {};
			mediaObj[ext] = file;
			this.preloadTimeout = setTimeout(function() {
				preloader.jPlayer("setMedia", mediaObj);
			},2000);
		}*/

		this.readySong = false;
	}
};

var Mix = {

	view: false,

	init: function(data) {
		this.view = new MixView({
			model: new MixModel(data),
			el: $("#mix")[0],
			id: data.id,
			isUserMix: data.isUserMix,
			isPublished: data.isPublished,
			pictureFile: data.pictureFile
		});

		AudioPlayer.init();
		this.view.renderInit();
	}
};

var Home = {

	waiting: false,

	init: function(){

		var that = this;

		$("#makeNewMixLink").on('click', function() {
			if (that.waiting) return;
			that.waiting = true;

			$.post(
				$(this).attr('data-url'),
				{},
				function(response) {
					if ((response.success) && (response.id)) {
						window.location = '/mix/' + response.id;
					}
					that.waiting = false;
				}
			);

			setTimeout(function() {
				that.waiting = false;
			});
		});

		$(".my-mixes-table").on('click', '.delete-mix-link', function() {

			var $this = $(this);
			if (!confirm('Are you sure you want to delete ' + $("#myMix_" + $this.attr('data-id')).html() + '?')) return;

			$.post(
				$this.attr('data-url'),
				{
					id: $this.attr('data-id')
				}
			);
			$("#myMixItem_" + $this.attr('data-id')).remove();
		});

	}

};

var isInit = false;

var App = {

	isInit:false,

	init: function(data) {

		if (isInit) return;
		isInit = true;

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

		switch (data.page) {
			case 'home':
				Home.init();
				break;

			case 'mix':
				Mix.init(data);
				break;

		}

	}


};