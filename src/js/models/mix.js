

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

	initialize: function() {
		//console.log("SONG", this.attributes);
		this.urlRoot = '/mix/' + this.attributes.mixId + '/song/';
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