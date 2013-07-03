

var SongModel = Backbone.Model.extend({
	
	url: function() {
        var origUrl = Backbone.Model.prototype.url.call(this);
        return origUrl + (origUrl.charAt(origUrl.length - 1) == '/' ? '' : '/');
    },

	defaults: {
		artist: 'Unknown',
		title: 'Untitled',
		songFile: '',
		isUserFav: false,
		totalFav: 0,
		songOrder: 1
	},

	onSync: function(model, resp, options) {
		this.set('totalFav', resp.total_fav);
	},

	initialize: function() {
		//console.log("SONG", this.attributes);
		this.urlRoot = '/mix/' + this.attributes.mixId + '/song/';
		this.listenTo(this, 'sync', this.onSync);
    }
});

var SongsCollection = Backbone.Collection.extend({
	model:SongModel,
	url: '',

	comparator: function( collection ){
		return( collection.get( 'songOrder' ) );
	},

	updateSongOrder: function() {
		Backbone.sync('update', this, {});
	}

});

var MixModel = Backbone.Model.extend({
	urlRoot: '/mix',

	url: function() {
        var origUrl = Backbone.Model.prototype.url.call(this);
        return origUrl + (origUrl.charAt(origUrl.length - 1) == '/' ? '' : '/');
    },

	defaults: {
		title: 'Mix Title',
		username: 'Dude',
		isUserMix: false,
		pictureFile: '',
		songs: [],
		comments: []
	},

	initialize: function() {
		this.songs = new SongsCollection(this.attributes.songs);
		this.songs.url = this.url() + 'update_song_order/';

		this.comments = new CommentsCollection();
		this.comments.url = this.url() + 'comments/';
		this.comments.fetch();
    }
});

var CommentModel = Backbone.Model.extend({
	url: function() {
        var origUrl = Backbone.Model.prototype.url.call(this);
        return origUrl + (origUrl.charAt(origUrl.length - 1) == '/' ? '' : '/');
    },

	defaults: {
		date: false,
		text: '',
		username: ''
	},

	onSync: function(model, resp, options) {
		//this.set('totalFav', resp.total_fav);
	},

	initialize: function() {
		this.urlRoot = '/mix/' + this.attributes.mixId + '/comment/';
		//this.listenTo(this, 'sync', this.onSync);
    }

});

var CommentsCollection = Backbone.Collection.extend({
	model:CommentModel,
	url: '/comments',

	comparator: function( collection ){
		return( collection.get( 'date' ) );
	},

	parse: function(response) {
		return response.comments;
	}

});