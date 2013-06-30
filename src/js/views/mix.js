var MixView = Backbone.View.extend({

	isPublished: true,
	
	initialize: function () {
		this.listenTo(this.model, "change:title", this.onChangeTitle);

		this.songs = new SongCollectionView({
			collection: this.model.songs,
			el: $(".song-list", this.el)[0]
		});
		this.songs.collection.trigger('reset');
	},

	onChangeTitle: function(model, options) {
		this.model.save(this.model.changed, {patch: true});
	},

	setUnpublished: function() {
		if (!this.isPublished) return;

		var me = this;
		$('body').addClass('unpublished');

		$('#mixTitle').editable({	
			type: 'text',
			showbuttons: false,
			title: 'Enter title',
			inputclass: 'mix-title'
		}).on('save', function(e, params){
			me.model.set('title', params.newValue);
		});

		$("#resetSongUploadQueue").click(function() {
			var uploader = $('#songUploader').pluploadQueue();
			uploader.splice();

			$('#songUploader .plupload_buttons').css('display', '');
			$('#songUploader .plupload_upload_status').css('display', '');

			return false;
		});

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

				UploadComplete: function(up) {
					// Called when the state of the queue is changed
					console.log('[UploadComplete]', up);
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

		this.options.isPublished = this.isPublished = false;
	},

	render: function() {
		console.log("rendering mix");

		$("#mixTitle").html(this.model.attributes.title);
		$("#mixUsername").html('by ' + this.model.attributes.username);

		if (this.options.isUserMix) {
			$('body').addClass('admin');

			if (!this.options.isPublished){
				this.setUnpublished();
			}

		}

		

		return this;
	}
});


var SongCollectionView = Backbone.View.extend({
	
	initialize: function () {
		var that = this;

		this.listenTo(this.collection, "reset", this.renderReset);

		this.songViews = [];
		this.collection.each(function(item) {
			that.songViews.push(new SongView({
				model: item,
				tagName: 'li',
				id: "song_" + item.attributes.id,
				className: 'title'
			}));
		});

	},

	renderReset: function() {

		var that = this;

		_(this.songViews).each(function(item) {
			that.$el.append(item.render().$el);
		});

		return this;
	}
});

var SongView = Backbone.View.extend({

	initialize: function() {
		this.listenTo(this.model, "change:title", this.renderTitle);

	},

	render: function() {
		console.log("render songview");
		this.$el.html(this.model.attributes.title);


		return this;
	},

	renderTitle: function() {
		console.log("render title");
		this.$el.html(this.model.attributes.title);
	}
});


var CommentView = Backbone.View.extend({
	render: function() {
		
	}
});