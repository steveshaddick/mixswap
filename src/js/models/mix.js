

var Song = Backbone.Model.extend({
	
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

var Songs = Backbone.Collection.extend({
	model:Song,
	url: '',

	comparator: function( collection ){
		return( collection.get( 'songOrder' ) );
	},

	updateSongOrder: function() {
		Backbone.sync('update', this, {});
	}

});

var Mix = Backbone.Model.extend({
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
		this.songs = new Songs(this.attributes.songs);
		this.songs.url = this.url() + 'update_song_order/';
    }
});

var Comment = Backbone.Model.extend({
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
		//console.log("SONG", this.attributes);
		this.urlRoot = '/mix/' + this.attributes.mixId + '/comment/';
		//this.listenTo(this, 'sync', this.onSync);
    }

});

var Comments = Backbone.Collection.extend({
	model:Comment,
	url: '',

	comparator: function( collection ){
		return( collection.get( 'date' ) );
	}

});