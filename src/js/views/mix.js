var MixView = Backbone.View.extend({

	isPublished: true,
	isSorting: false,
	currentPlayingSong: false,
	
	initialize: function () {
		this.listenTo(this.model, "change:title", this.onChange);
		this.listenTo(this.model, "change:pictureFile", this.renderPictureFile);
		this.listenTo(this.model, "change:isPublished", this.renderPublished);

		this.songs = new SongCollectionView({
			collection: this.model.songs,
			el: $(".song-list", this.el)[0]
		});

		this.comments = new CommentCollectionView({
			collection: this.model.comments,
			el: $("#commentsList")[0]
		});
	
	},

	playSong: function(song, autoPlay) {
		if (!song) return;

		if (this.currentPlayingSong != song) {
			this.songStopHandler();
		}

		this.currentPlayingSong = song;
		$("#song_" + this.currentPlayingSong.id).addClass('playing');
		EventDispatcher.dispatchEvent('songPlay', {song: this.currentPlayingSong, autoPlay: autoPlay} );
	},

	songStopHandler: function() {

		$("#song_" + this.currentPlayingSong.id).removeClass('playing');
		this.currentPlayingSong = false;
	},

	songEndedHandler: function() {
		this.playNextSong();
	},

	playNextSong: function() {
		if (!this.currentPlayingSong) return;

		var nextSong = this.songs.collection.findWhere({songOrder: this.currentPlayingSong.attributes.songOrder + 1});
		if (nextSong) {
			this.playSong(nextSong);
		}
	},

	onChange: function(model, options) {
		this.model.save(this.model.changed, {patch: true});
	},

	setPublished: function() {
		if (this.isPublished) return;

		var that = this;

		$('body').removeClass('unpublished');

		$('#mixTitle').editable('destroy').off('save');
		this.songs.$el.off('click', '.song-delete');

		$("#removeBG").off('click');
		$("#publishMixLink").off('click');

		this.songs.$el.sortable('destroy');

		$("#songUploader").pluploadQueue().destroy();
		$("#songUploader").unbind();
		$('#uploadSongForm').unbind();

		$("#picUploader").pluploadQueue().destroy();
		$("#picUploader").unbind();
		$('#uploadPictureForm').unbind();

		this.options.isPublished = this.isPublished = true;

	},

	setUnpublished: function() {
		if (!this.isPublished) return;

		var that = this;
		$('body').addClass('unpublished');

		$('#mixTitle').editable({	
			type: 'text',
			showbuttons: false,
			title: 'Enter title',
			inputclass: 'mix-title'
		}).on('save', function(e, params){
			that.model.set('title', params.newValue);
		});

		this.songs.$el.on('click', '.song-delete', function() {
			$item = $(this).parent();
			var songModel = that.songs.collection.get($item.attr('id').replace('song_', ''));

			if (confirm("Are you sure you want to delete " + songModel.attributes.title + " by " + songModel.attributes.artist + "?")) {
				songModel.destroy();
			}
		});

		$("#removeBG").on('click', function() {
			that.model.set('pictureFile', '');
			that.model.save(that.model.changed, {patch: true});
		});

		$("#publishMixLink").on('click', function() {
			that.model.set('isPublished', true);
			that.model.save(that.model.changed, {patch: true});
		});

		this.songs.$el.sortable({
			start: function() {
				that.isSorting = true;
			},
			stop: function() {
				setTimeout(
					function() {
						that.isSorting = false;
					},0);
			},
			update:function(event, ui) {
				that.songs.reorderSongs();
			}
		});

		//song uploader
		$("#songUploader").pluploadQueue({
			// General settings
			runtimes : 'html5,flash,silverlight',
			url : $('#uploadSongForm').attr('action'),
			file_data_name: 'songfile',
			max_file_size : '100mb',
			unique_names : true,
			headers: {"X-CSRFToken": GLOBAL.csrfToken}, 
			rename: true,

			// Specify what files to browse for
			filters : [
				{title : "Music files", extensions : "mp3,mp4,m4a"}
			],

			// Flash settings
			flash_swf_url : '/static/js/plupload/plupload.flash.swf',

			// Silverlight settings
			silverlight_xap_url : '/static/js/plupload/plupload.silverlight.xap',

			init : {
				Error: function(up, args) {
					// Called when a error has occured
					console.log('[error] ', args);
				},

				UploadComplete: function(up, args) {
					// Called when the state of the queue is changed
					//console.log('[UploadComplete]', up, args);
					var uploader = $('#songUploader').pluploadQueue();
					uploader.splice();

					$('#songUploader .plupload_buttons').css('display', '');
					$('#songUploader .plupload_upload_status').css('display', '');
				},

				FileUploaded: function(up, file, response) {
					// Called when the state of the queue is changed
					//console.log('[File Uploaded]', response);
					var data = JSON.parse(response.response);

					if (data.success) {
						song = new SongModel({
							id: data.song_id,
							artist: data.artist,
							title: data.title,
							songOrder: data.song_order,
							songFile: data.song_file
						});
						that.songs.collection.add(song);
					} else {
						alert("There was an error uploading: " + data.error);
					}
				}
			}
		});

		// Client side form validation
		$('#uploadSongForm').submit(function(e) {
			var uploader = $('#songUploader').pluploadQueue();

			// Files in queue upload them first
			if (uploader.files.length > 0) {
				// When all files are uploaded submit form
				uploader.bind('StateChanged', function() {
					if (uploader.files.length === (uploader.total.uploaded + uploader.total.failed)) {
						$('#uploadSongForm')[0].submit();
					}
				});
					
				uploader.start();
			} else {
				alert('You must queue at least one file.');
			}

			return false;
		});


		//image uploader
		$("#picUploader").pluploadQueue({
			// General settings
			runtimes : 'html5,flash,silverlight',
			url : $('#uploadPictureForm').attr('action'),
			file_data_name: 'picfile',
			max_file_size : '10mb',
			unique_names : true,
			headers: {"X-CSRFToken": GLOBAL.csrfToken}, 
			dragdrop:false,
			drop_element: "bgDropper",

			// Resize images on clientside if we can
			resize : {width : 2000, height : 2000, quality : 70},
			rename: true,

			// Specify what files to browse for
			filters : [
				{title : "Image files", extensions : "jpg,gif,png"}
			],

			// Flash settings
			flash_swf_url : '/static/js/plupload/plupload.flash.swf',

			// Silverlight settings
			silverlight_xap_url : '/static/js/plupload/plupload.silverlight.xap',

			init : {
				Error: function(up, args) {
					// Called when a error has occured
					console.log('[error] ', args);
				},

				FilesAdded: function() {
					$('#picUploader').pluploadQueue().start();
				},

				UploadComplete: function(up, args) {
					// Called when the state of the queue is changed
					//console.log('[UploadComplete]', up, args);
					var uploader = $('#picUploader').pluploadQueue();
					uploader.splice();

					$('#picUploader .plupload_buttons').css('display', '');
					$('#picUploader .plupload_upload_status').css('display', '');
				},

				FileUploaded: function(up, file, response) {
					// Called when the state of the queue is changed
					var data = JSON.parse(response.response);

					if (data.success) {
						that.model.set('pictureFile', data.file);
					} else {
						alert("There was an error uploading: " + data.error);
					}
					
				}
			}
		});
		
		$("#picUploader_browse").html("Add");



		// Client side form validation
		$('#uploadPictureForm').submit(function(e) {
			var uploader = $('#picUploader').pluploadQueue();

			// Files in queue upload them first
			if (uploader.files.length > 0) {
				// When all files are uploaded submit form
				uploader.bind('StateChanged', function() {
					if (uploader.files.length === (uploader.total.uploaded + uploader.total.failed)) {
						$('#uploadPictureForm')[0].submit();
					}
				});
					
				uploader.start();
			} else {
				alert('You must queue at least one file.');
			}

			return false;
		});



		this.options.isPublished = this.isPublished = false;
	},

	renderInit: function() {

		$("#mixTitle").html(this.model.attributes.title);
		$("#mixUsername").html('by ' + this.model.attributes.username);

		if (this.options.isUserMix) {
			$('body').addClass('admin');

			if (!this.options.isPublished){
				this.setUnpublished();
			}
		}

		this.renderPictureFile();
		this.songs.collection.trigger('reset');

		if (this.options.isPublished) {
			var song = this.songs.collection.findWhere({songOrder: 1});
			this.playSong(song, false);
		}

		var that = this;
		this.songs.$el.on('click', '.song-wrapper', function() {
			if (that.isSorting) return;

			$item = $(this).parent();
			var song = that.songs.collection.get($item.attr('id').replace('song_', ''));
			if (this.currentPlayingSong != song) {
				that.playSong(song);
			}
		});

		this.songs.$el.on('change', '.favourite-checkbox', function() {
			$item = $(this).parent();
			var song = that.songs.collection.get($item.attr('id').replace('song_', ''));
			song.set('isUserFav', this.checked);
			song.save(song.changed, {patch: true});
		});

		if (this.options.isUserMix) {
			$("#unpublishMixLink").on('click', function() {
				that.model.set('isPublished', false);
				that.model.save(that.model.changed, {patch: true});
			});
		}

		$("#btnAddComment").on('click', function() {
			var text = $("#txtAddComment").val().trim();
			if (text == '') return;

			var now = new Date();
			var comment = new CommentModel({
				'username': that.model.get('username'),
				'date': now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate(),
				'text': text,
				'mixId': that.model.get('id')
			});
			comment.save();
			that.comments.collection.add(comment);
			$("#txtAddComment").val('');
		});

		//EventDispatcher.addEventListener('songStop', function(){ that.songStopHandler(); });
		EventDispatcher.addEventListener('songEnded', function(){ that.songEndedHandler(); });

		return this;
	},

	renderPictureFile: function() {
		if (this.model.attributes.pictureFile != '') {
			$("#mainWrapper").css('background-image', 'url(' + this.model.attributes.pictureFile + ')');
			$("#removeBG").css('display', '');
		} else {
			$("#mainWrapper").css('background-image', '');
			$("#removeBG").css('display', 'none');
		}
	},

	renderPublished: function() {
		if (this.model.attributes.isPublished) {
			this.setPublished();
		} else {
			this.setUnpublished();
		}
	}
});


var SongCollectionView = Backbone.View.extend({
	
	songViews: [],

	initialize: function () {
		var that = this;

		this.listenTo(this.collection, "reset", this.renderReset);
		this.listenTo(this.collection, "changeSongOrder", this.onChangeOrder);
		this.listenTo(this.collection, "destroy", this.reorderSongs);
		this.listenTo(this.collection, "add", this.addSong);

		this.songViews = [];
		this.collection.each(function(item) {
			that.songViews.push(new SongView({
				model: item,
				songCollectionView: that
			}));
		});

	},

	addSong: function(model) {
		var songView = new SongView({
			model: model,
			songCollectionView: this
		});

		this.songViews.push(songView);

		this.$el.append(songView.render().$el);
	},

	renderReset: function() {

		var that = this;

		this.$el.empty();
		_(this.songViews).each(function(item) {
			that.$el.append(item.render().$el);
		});

		return this;
	},

	reorderSongs: function() {
		var $item;
		var count = 1;
		var songModel;
		var that = this;

		$(".song-item", this.$el).each(function() {
			$item = $(this);
			if ($item.attr('data-order') != count) {
				songModel = that.collection.get($item.attr('id').replace('song_', ''));
				songModel.set('songOrder', count);
			}
			count ++;
		});

		this.collection.trigger('changeSongOrder');
	},

	onChangeOrder: function() {
		this.collection.updateSongOrder();
	},

	removeView: function(view) {
		var viewIndex = _(this.songViews).indexOf(view);
		this.songViews.splice(viewIndex, 1);
	}
});

var SongView = Backbone.View.extend({

	initialize: function() {
		this.listenTo(this.model, "change:title", this.renderTitle);
		this.listenTo(this.model, "change:songOrder", this.renderSongOrder);
		this.listenTo(this.model, "change:totalFav", this.renderTotalFav);
		this.listenTo(this.model, "destroy", this.onDestroy);

		this.id = "song_" + this.model.attributes.id;
	},

	render: function() {
		var $item = $("#tmpSongItem").clone();

		$item.attr('id', this.id).attr('data-order', this.model.songOrder);
		$('.song-title', $item).html(this.model.attributes.title);
		$('.song-artist', $item).html(this.model.attributes.artist);
		$('.song-order', $item).html(this.model.attributes.songOrder);
		$('.total-favourite', $item).html(this.model.attributes.totalFav + " favs");
		$('.favourite-checkbox', $item)[0].checked = this.model.attributes.isUserFav;

		this.$el = $item;

		return this;
	},

	renderTitle: function() {
		$('.song-title', this.$el).html(this.model.attributes.title);
	},

	renderSongOrder: function() {
		$('.song-order', this.$el).html(this.model.attributes.songOrder);
	},

	renderTotalFav: function() {
		$('.total-favourite', this.$el).html(this.model.attributes.totalFav + " favs");
	},

	onDestroy: function(model) {
		this.remove();
		this.options.songCollectionView.removeView(this);
	}
});

var CommentCollectionView = Backbone.View.extend({



	initialize: function () {
		var that = this;

		this.listenTo(this.collection, "add", this.addComment);
		//this.listenTo(this.collection, "sync", this.renderInitial);

		/*syncCollection= function() {
			that.collection.fetch();
			setTimeout(syncCollection, 300000);
		};
		setTimeout(syncCollection, 300000);*/
	},

	addComment: function(model) {
		var commentView = new CommentView({
			model: model
		});
		commentView.render();
		this.$el.prepend(commentView.$el);
	}
});


var CommentView = Backbone.View.extend({
	initialize: function () {
		this.render();
	},

	render: function() {
		var $item = $("#tmpCommentItem").clone();

		$item.attr('id', '');
		$('.username', $item).html(this.model.attributes.username);
		$('.date', $item).html(this.model.attributes.date);
		$('.text', $item).html(this.model.attributes.text);

		this.$el = $item;

		return this;
	}
});