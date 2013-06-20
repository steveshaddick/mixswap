

var Song = Backbone.Model.extend({

	defaults: {
		artist: 'Unknown',
		title: 'Untitled',
		isUserFav: false,
		totalFav: 0,
		prefix: ''
	},

	initialize: function() {
		//console.log("SONG", this.attributes);
		this.urlRoot = '/mix/' + this.attributes.mixId + '/song/';
    }
});

var Songs = Backbone.Collection.extend({
	model:Song

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
		pictureFiel: '',
		songs: [],
		comments: []
	},

	initialize: function() {
		this.songs = new Songs(this.attributes.songs);
    }
});