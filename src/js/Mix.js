var mix;

function Mix(_mixId, _isMyMix, _isPublished, _bgImage)
{
	//private var
	var me = this;
	
	var mixTitle;
	var audioPlayer;
	var comments;
	var currentTrack;
	var currentSong;
	
	var songs = Array();
	
	var dragSource = false;
	var dragTarget = false;
	
	var isMyMix = _isMyMix;
	var isPublished = _isPublished;
	
	var filetype= 'mp3';
	var mixFolder = '<?=$mixFolder?>';
	var isEditable;
	var modal;
	
	//public var
	this.mixId = _mixId;
	this.elements = Array();
	
	
	//private function
	function changeTitle()
	{
		var ajax;
		var newTitle = prompt("Enter new title", me.elements['mixTitle'].innerHTML);
		if ((newTitle != null) && (newTitle != "")) {
			ajax = new AJAX('<?=PHP_CHANGE_TITLE?>', {mixId:me.mixId , newTitle: newTitle});
			ajax.send();
			me.elements['mixTitle'].innerHTML = newTitle;
		}
	}
	
	function togglePublish()
	{
		var ajax;
		isPublished = !isPublished;
		
		var isEmail = 'false';
		
		if (isPublished) {
			isEmail = prompt("Do you want to send an email to everyone?  Enter 'y' if yes.");
			isEmail = isEmail.toLowerCase();
			isEmail = (isEmail == 'y') ? "true" : "false";
		}
		ajax = new AJAX('<?=PHP_PUBLISH_MIX?>', {mixId:me.mixId, isPublished:((isPublished)? 1 : 0), isEmail:isEmail});
		ajax.send();
		
		if (isPublished) {
			me.elements['publishSection'].className = 'published';
			me.elements['publishMix'].innerHTML = "Unpublish";
		} else {
			me.elements['publishSection'].className = 'unpublished';
			me.elements['publishMix'].innerHTML = "Publish";
		}
		
		setEditable();
	}
	
	function setEditable()
	{
		isEditable = ((isMyMix) && (!isPublished));
		if (isEditable) {
			me.elements['mixTitle'].onclick = changeTitle;
			
			me.elements['addTrack'].style.display = "block";
			me.elements['changeBG'].style.display = "block";
			me.elements['commentsSection'].style.display = "none";
			
			document.getElementById('btnUploadSong').onclick = uploadSong;
			document.getElementById('btnUploadBG').onclick = uploadBG;
			
			for (var i=0, len=songs.length; i<len; i++)
			{
				songs[i].setEditable(true);
				songs[i].element.addEventListener('dragstart', dragStart, false);
				
				songs[i].element.addEventListener('dragenter', dragEnter, false);
				songs[i].element.addEventListener('dragover', dragOver, false);
				songs[i].element.addEventListener('dragleave', dragLeave, false);
				songs[i].element.addEventListener('drop', dragDrop, false);
				songs[i].elements['deleteLink'].onclick = deleteSong;
				songs[i].elements['editLink'].onclick = editSong;
			}
		
		} else {
			me.elements['mixTitle'].onclick = null;
			
			me.elements['addTrack'].style.display = "none";
			me.elements['changeBG'].style.display = "none";
			me.elements['commentsSection'].style.display = "block";
			
			document.getElementById('btnUploadSong').onclick = null;
			document.getElementById('btnUploadBG').onclick = null;
			
			for (var i=0, len=songs.length; i<len; i++)
			{
				songs[i].setEditable(false);
				songs[i].element.removeEventListener('dragstart', dragStart, false);
				songs[i].element.removeEventListener('dragenter', dragEnter, false);
				songs[i].element.removeEventListener('dragover', dragOver, false);
				songs[i].element.removeEventListener('dragleave', dragLeave, false);
				songs[i].element.removeEventListener('drop', dragDrop, false);
				songs[i].elements['deleteLink'].onclick = null;
				songs[i].elements['editLink'].onclick = null;
			}
		}
	}
	
	function listSongs()
	{
		var isReseting = false;
		var songList = me.elements['songList'];
		
		for (var i=0,len=songs.length; i<len; i++)
		{
			if (typeof songList.childNodes[i] != 'undefined') {
				if (songList.childNodes[i] != songs[i].element) {
					
					songList.replaceChild(songs[i].element, songList.childNodes[i]);
				}
			} else {
				songList.appendChild(songs[i].element);
			}
			songs[i].setIndex(i);
		}
		
		while (songList.childNodes.length > songs.length)
		{
			songList.removeChild(songList.lastChild);
		}
	}
	
	function deleteSong()
	{
		var song = songs[parseInt(this.parentNode.parentNode.getAttribute('data-index'))];
		if (confirm("Delete "+song.title+" by "+song.artist+"?")) {
			var ajax = new AJAX('<?=PHP_DELETE_SONG?>', {mixId:me.mixId, songId: song.songId, songIndex:song.index}, deleteSongHandler );
			ajax.send();
		}
	}
	
	function editSong()
	{
		var song = songs[parseInt(this.parentNode.parentNode.getAttribute('data-index'))];
		
		var oldTitle = song.title;
		var oldArtist = song.artist;
		
		var newTitle = prompt("Enter new title", song.title);
		if (newTitle == null) {
			return;
		}
		if (newTitle == oldTitle) {
			newTitle = '';
		}
		
		var newArtist = prompt("Enter new artist", song.artist);
		if (newArtist == null) {
			return;
		}
		if (newArtist == oldArtist) {
			newArtist = '';
		}
		
		if ((newTitle != '') || (newArtist != "")){
			var ajax = new AJAX('<?=PHP_EDIT_SONG?>', {mixId:me.mixId, songId: song.songId, title:newTitle, artist:newArtist});
			ajax.send();
		}
		
		if (newTitle != '') {
			this.parentNode.parentNode.getElementsByClassName('songTitle')[0].innerHTML = newTitle;
		}
		if (newArtist != '') {
			this.parentNode.parentNode.getElementsByClassName('songArtist')[0].innerHTML = newArtist;
		}
		
	}
	
	function editSongHandler(data)
	{
		console.log(data);
	}

	
	function deleteSongHandler(req)
	{
		var obj = eval('(' + req.responseText + ')');
		var songIndex = parseInt(obj.songIndex);
		
		removeSong(songIndex);
	}
	
	function removeSong(songIndex)
	{
		songs.splice(songIndex, 1);
		listSongs();
	}
	
	function playSong(song)
	{
		if (typeof currentSong != 'undefined') {
			currentSong.setPlaying(false);
		}
		currentTrack = song.index;
		audioPlayer.playSong(song);
		currentSong = song;
		song.setPlaying(true);
	}
	
	function playHandler()
	{
		currentSong = songs[currentTrack];
		currentSong.setPlaying(true);
	}
	
	function pauseHandler()
	{
		currentSong.setPlaying(false);
	}
	
	function playNextTrack()
	{
		currentTrack = (currentTrack < (songs.length - 1)) ? currentTrack + 1 : 0;
		if (currentTrack > 0) {
			playSong(songs[currentTrack]);
		}
	}
	
	function uploadSong()
	{
		modal = new Modal('Uploading song...');
		document.getElementById('frmUploadSong').submit();
	}
	
	function uploadBG()
	{
		modal = new Modal('Uploading image...');
		document.getElementById('frmUploadBG').submit();
	}
	
	function setBG(_bgImage)
	{
		document.body.style.backgroundImage = 'url(' + mixFolder + _bgImage +')';
	}
	
	function dragStart(e)
	{
		e.stopPropagation();
		dragSource = this;
		dragSource.addEventListener('dragend', dragEnd, false);
		
		g.addClassName(dragSource, 'dragged');
		e.dataTransfer.effectAllowed='move';
		e.dataTransfer.setDragImage(dragSource ,0,0);
		
		return true;
	}
	
	function dragEnter(e) {

		if (dragTarget){
			g.removeClassName(dragTarget, 'dragOver');
			dragTarget = false;
		}
		if (dragSource != this) {
			dragTarget = this;
			g.addClassName(dragTarget, 'dragOver');
			e.dataTransfer.dropEffect = 'move';	
		}
		return false;
	}
	function dragOver(e) {
		e.stopPropagation();
		e.preventDefault();
		return false;
	}
	function dragLeave(e) {
		if ((dragTarget) && (dragTarget != this)){
			g.removeClassName(dragTarget, 'dragOver');
		}
	}
	function dragEnd(e) {
		if (dragTarget) {
			g.removeClassName(dragTarget, 'dragOver');
			dragTarget = false;
		}
		if (dragSource) {
			g.removeClassName(dragSource, 'dragged');
			dragSource.removeEventListener('dragend', dragEnd, false);
			dragSource = false;
		}
	}
	
	function dragDrop(e) {
		console.log(dragTarget, "DROP");
		e.stopPropagation();
		g.removeClassName(dragSource, 'dragged');
		if (dragTarget) {
			g.removeClassName(dragTarget, 'dragOver');
			if (dragSource != e.target) {
				
				var sourceIndex = parseInt(dragSource.getAttribute('data-index'));
				var targetIndex = parseInt(dragTarget.getAttribute('data-index'));
				
				if (targetIndex > sourceIndex) {
					songs.splice(targetIndex + 1, 0, songs[sourceIndex]);
					songs.splice(sourceIndex, 1);
				} else {
					songs.splice(targetIndex, 0, songs[sourceIndex]);
					songs.splice(sourceIndex + 1, 1);
				}
				listSongs();
		   }
		}
	   return false;
	}
	
	//public function
	this.addSong = function(_songId, _artist, _title, _file, _isMyFavourite, _favCount)
	{
		if (_artist == '') {
			_artist = '[unartisted]';
		}
		if (_title == '') {
			_title = '[untitled]';
		}
		
		var newSong = new SongItem(_songId, songs.length, _artist, _title, _file, _isMyFavourite, _favCount, isEditable);
		songs.push(newSong);

		this.elements['songList'].appendChild(newSong.element);
		
		if (isEditable) {
			newSong.element.addEventListener('dragstart', dragStart, false);
			newSong.element.addEventListener('dragenter', dragEnter, false);
			newSong.element.addEventListener('dragover', dragOver, false);
			newSong.element.addEventListener('dragleave', dragLeave, false);
			newSong.element.addEventListener('drop', dragDrop, false);
			
		}
		
		//for lack of custom event dispatching
		newSong.elements['songLink'].onclick = function (e) {
			playSong(newSong);
		}
		
		if (isEditable) {
			newSong.elements['deleteLink'].onclick = deleteSong;
			newSong.elements['editLink'].onclick = editSong;
		}
		
		listSongs();
	}
	
	this.addComment = function(_userName, _time, _comment)
	{
		comments.addComment(new CommentItem(_userName, _time, _comment));
	}
	
	this.uploadSongDone = function(_songId, _artist, _title, _file)
	{
		this.addSong(_songId, _artist, _title, _file, false, 0);
		document.getElementById("frmUploadSong").reset();
		modal.closeModal();
	}
	
	this.uploadBGDone = function(_bgImage)
	{
		setBG(_bgImage);
		document.getElementById("frmUploadBG").reset();
		modal.closeModal();
	}

	//constructor
	this.elements['mixTitle'] = document.getElementById('mixTitle');
	this.elements['songList'] = document.getElementById('songList');
	this.elements['commentsSection'] = document.getElementById('scnComments');

	currentTrack = 0;
	
	audioPlayer = new AudioPlayer();
	audioPlayer.elements['audioElement'].addEventListener('ended', playNextTrack, false);
	audioPlayer.elements['audioElement'].addEventListener('play', playHandler, false);
	audioPlayer.elements['audioElement'].addEventListener('pause', pauseHandler, false);

	if (!isMyMix) {

		g.removeElementById('scnPublishMix');
		g.removeElementById('scnAddTrack');
		g.removeElementById('scnChangeBG');
		
	} else {
		
		this.elements['publishMix'] = document.getElementById('aPublishMix');
		this.elements['publishSection'] = document.getElementById('scnPublishMix');
		this.elements['addTrack'] = document.getElementById('scnAddTrack');
		this.elements['changeBG'] = document.getElementById('scnChangeBG');
		
		this.elements['publishMix'].onclick = togglePublish;
		document.getElementById('scnPublishMix').style.display = "block";
		if (isPublished) {
			me.elements['publishSection'].className = 'published';
			this.elements['publishMix'].innerHTML = "Unpublish";
		} else {
			me.elements['publishSection'].className = 'unpublished';
			this.elements['publishMix'].innerHTML = "Publish";
		}
		
		setEditable();
	}
	
	comments = new Comments();
	
	setBG(_bgImage);
}

function AudioPlayer()
{
	//private var
	var songFolder = '<?=$songsFolder?>';
	
	//public var
	this.element = document.getElementById('scnAudioPlayer');
	this.elements = Array();
	this.elements['audioElement'] = document.getElementById('audioElement');
	this.elements['currentTitle'] = document.getElementById('currentTitle');
	this.elements['currentArtist'] = document.getElementById('currentArtist');
	
	//public function
	this.playSong = function(songItem)
	{
		this.elements['currentTitle'].innerHTML = songItem.title;
		this.elements['currentArtist'].innerHTML = songItem.artist;
		
		this.elements['audioElement'].src = songFolder + songItem.file;
		this.elements['audioElement'].setAttribute('autoplay', 'autoplay');
		this.elements['audioElement'].load();
	}
	
	//constructor
	//audioElement.addEventListener('ended', function(e) { g.mixList.playNextTrack(); }, false);
	
}

function SongItem(_songId, _index, _artist, _title, _file, _isMyFavourite, _favCount, _isEditable)
{
	//private var
	var me = this;
	var favCount = _favCount;
	
	//public var
	this.songId = _songId;
	
	this.element = document.getElementById('refSongItem').cloneNode(true);
	this.elements = Array();
	this.elements['hitDrag'] = this.element.getElementsByClassName('hitDrag')[0];
	this.elements['chkFav'] = this.element.getElementsByClassName('chkFavourite')[0];
	this.elements['divFav'] = this.element.getElementsByClassName('divFavourite')[0];
	this.elements['songLink'] = this.element.getElementsByClassName('songLink')[0];
	this.elements['divDrag'] = this.element.getElementsByClassName('divDrag')[0];
	this.elements['deleteLink'] = this.element.getElementsByClassName('songDeleteLink')[0];
	this.elements['editLink'] = this.element.getElementsByClassName('songEditLink')[0];
	this.elements['song'] = this.element.getElementsByClassName('divSong')[0];
	this.elements['trackNumber'] = this.element.getElementsByClassName('songTrack')[0];
	this.elements['artist'] = this.element.getElementsByClassName('songArtist')[0];
	this.elements['title'] = this.element.getElementsByClassName('songTitle')[0];
	this.elements['favCount'] = this.element.getElementsByClassName('favCount')[0];
	
	this.artist = _artist;
	this.title = _title;
	this.index = _index;
	this.file = _file;
	
	//prive function
	function chkFavHandler()
	{
		var isFavourite = (me.elements['chkFav'].checked) ? 1 : 0;
		var ajax = new AJAX('<?=PHP_FAV_SONG?>', {mixId:mix.mixId, songId: me.songId, isFavourite:isFavourite}, favSongHandler );
		ajax.send();
	}

	function favSongHandler(req)
	{
		var obj = eval('(' + req.responseText + ')');
		favCount = parseInt(obj.favCount);
		setFavCount();
	}
	
	function setFavCount()
	{
		me.elements['favCount'].innerHTML = favCount + " favs";
	}

	//public function
	this.setIndex = function(i)
	{
		var oldIndex = this.index;
		if (oldIndex != i) {
			this.index = i;
			this.element.setAttribute('id', 'songItem_' + i);
			this.element.setAttribute('data-index', this.index);
			this.elements['trackNumber'].innerHTML = i + 1;
			var ajax = new AJAX('<?=PHP_SONG_INDEX?>', {songOrder:this.index , songId: this.songId });
			ajax.send();
		}
		
	}
	
	this.setEditable = function(_isEditable)
	{
		if (_isEditable) {
			this.elements['hitDrag'].style.display = "inline";
			this.elements['deleteLink'].style.display = "inline";
			this.elements['editLink'].style.display = "inline";
			this.elements['divFav'].style.display = "none";
			this.elements['divDrag'].style.display = "inline-block";
			this.element.setAttribute('draggable', 'true');
			
		} else {
			this.elements['hitDrag'].style.display = "none";
			this.elements['deleteLink'].style.display = "none";
			this.elements['editLink'].style.display = "none";
			this.elements['divFav'].style.display = "inline";
			this.element.setAttribute('draggable', 'false');
			this.elements['divDrag'].style.display = "none";
		}
	}
	
	this.setPlaying = function(_isPlaying)
	{
		if (_isPlaying) {
			g.addClassName(this.elements['song'], 'songPlaying');
		} else {
			g.removeClassName(this.elements['song'], 'songPlaying');
		}
	}
	
	//constructor
	this.element.setAttribute('id', 'songItem_' + this.index);
	this.element.setAttribute('data-index', this.index);
	
	this.elements['chkFav'].onclick = chkFavHandler;
	if (_isMyFavourite) {
		this.elements['chkFav'].checked = true;
	}
	
	
	this.setEditable(_isEditable);
	
	this.elements['trackNumber'].innerHTML = this.index + 1;
	this.elements['artist'].innerHTML = this.artist;
	this.elements['title'].innerHTML = this.title;
	
	setFavCount();
}

function Comments()
{
	//private var
	var me = this;
	
	//public var
	this.element = document.getElementById('scnComments');
	this.elements = Array();
	this.elements['commentsList'] = document.getElementById('divCommentsList');
	this.elements['txtAddComment'] = document.getElementById('txtAddComment');
	this.elements['btnAddComment'] = document.getElementById('btnAddComment');
	
	//private function
	function listComments()
	{
		for (var i=0, len=coments.length; i<len; i++)
		{
			
		}
	}
	
	function addCommentClick()
	{
		var ajax = new AJAX('<?=PHP_ADD_COMMENT?>', {mixId:mix.mixId, comment:escape(me.elements['txtAddComment'].value) }, addCommentHandler);
		ajax.send();
	}
	
	function addCommentHandler(req)
	{
		var date = new Date();
		me.addComment(new CommentItem('<?=$displayName?>', date.toDateString(), me.elements['txtAddComment'].value));
		me.elements['txtAddComment'].value = "";
	}
	
	//public function
	this.addComment = function(_commentItem)
	{
		this.elements['commentsList'].insertBefore(_commentItem.element, this.elements['commentsList'].firstChild);
	}
	
	
	//constructor
	this.elements['btnAddComment'].onclick = addCommentClick;
}

function CommentItem(_userName, _time, _text)
{
	//private var
	var me = this;
	var date = new Date(_time);
	
	//public var
	this.element = document.getElementById('refCommentItem').cloneNode(true);
	this.element.removeAttribute('id');
	this.elements = Array();
	this.elements['userName'] = this.element.getElementsByClassName('commentUserName')[0];
	this.elements['time'] = this.element.getElementsByClassName('commentTime')[0];
	this.elements['text'] = this.element.getElementsByClassName('commentText')[0];
	
	//constructor
	this.elements['userName'].innerHTML = _userName;
	this.elements['time'].setAttribute('datetime', date.toString());
	this.elements['time'].innerHTML = date.toDateString();
	this.elements['text'].innerHTML = _text;
}


function handleOrientationChange() {
	switch (window.orientation) {
		case 0:
			// Handle device in portrait mode.
			break;
		case -90:
			// Handle device in landscape mode turned clockwise.
			break;
		case 90:
			// Handle device in landscape mode turned counterclockwise.
			break;
		case 180:
			// Handle device in portrait mode upside-down.
			break;
	}
}