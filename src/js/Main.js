var GLOBAL = {
	csrfToken : ''
};

var Main = (function() {

	function csrfSafeMethod(method) {
		// these HTTP methods do not require CSRF protection
		return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
	}

	function init() {

		GLOBAL.csrfToken = Cookie.get('csrftoken');

		$.ajaxSetup({
			crossDomain: false,
			beforeSend: function(xhr, settings) {
				if (!csrfSafeMethod(settings.type)) {
					xhr.setRequestHeader("X-CSRFToken", GLOBAL.csrfToken);
				}
			}
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

		$('#uploadPictureForm').fileupload({

			acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
			maxFileSize: 5000000,
			disableImageResize: false,
			imageMaxHeight: 300

		}).bind('fileuploadprogress', function (e, data) { console.log("progress",data); }).bind('fileuploadprogressall', function (e, data) { console.log("all",data); });

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

	return {
		init: init
	};

})();