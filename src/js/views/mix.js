var MixView = Backbone.View.extend({
	
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

	render: function() {
		console.log("rendering mix");

		$("#mixTitle").html(this.model.attributes.title);
		$("#mixUsername").html('by ' + this.model.attributes.username);


		if ((!this.options.isPublished) && (this.options.isUserMix)){
			var me = this;

			$('body').addClass('admin');
			$('#mixTitle').editable({	
				type: 'text',
				showbuttons: false,
				title: 'Enter title',
				inputclass: 'mix-title'
			}).on('save', function(e, params){
				me.model.set('title', params.newValue);
			});
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