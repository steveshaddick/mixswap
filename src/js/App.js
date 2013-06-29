var GLOBAL = {
	csrfToken : ''
};

function csrfSafeMethod(method) {
	// these HTTP methods do not require CSRF protection
	return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

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
			isPublished: data.isPublished
		}).render();

		//this.mixView.model.save({username: "hello"}, {patch:true});
		this.mixView.songs.collection.get(1).set({title : "New Title"});

		$("#picUploader").pluploadQueue({
			// General settings
			runtimes : 'html5,flash,silverlight',
			url : $('#uploadPictureForm').attr('action'),
			file_data_name: 'picfile',
			max_file_size : '10mb',
			unique_names : true,
			headers: {"X-CSRFToken": GLOBAL.csrfToken}, 

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
			silverlight_xap_url : '/static/js/plupload/plupload.silverlight.xap'
		});

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



		
		/*$('#uploadPictureForm').each(function () {
			var that = this;
			$.getJSON(this.action, function (result) {
				if (result && result.length) {
					$(that).fileupload('option', 'done')
						.call(that, null, {result: result});
				}
			});
		});*/

		/*$('#uploadPictureForm').fileupload({

			acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
			maxFileSize: 5000000,
			disableImageResize: false,
			imageMaxHeight: 300

		}).bind('fileuploadprogress', function (e, data) { console.log("progress",data); }).bind('fileuploadprogressall', function (e, data) { console.log("all",data); });
*/

		/*$("#uploadPictureForm").on('submit', function(e) {
			//e.preventDefault();

			var $frm = $(this);


			function progressHandlingFunction(data) {
				console.log(data);
			}

			$.ajax({
				url: $frm.attr('action'),  //server script to process data
				type: 'POST',
				xhr: function() {  // custom xhr
					var myXhr = $.ajaxSettings.xhr();
					if(myXhr.upload){ // check if upload property exists
						myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // for handling the progress of the upload
					}
					return myXhr;
				},
				//Ajax events
				beforeSend: beforeSendHandler,
				success: function(response) {
					console.log(response);
				},
				error: errorHandler,
				// Form data
				data: data,
				//Options to tell JQuery not to process data or worry about content-type
				cache: false,
				contentType: false,
				processData: false
			});

			return false;
		});*/
	}


};