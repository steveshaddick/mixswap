from django.http import HttpResponseRedirect, HttpResponse, Http404
from django.shortcuts import get_object_or_404, render, redirect
from django.template import Context, loader
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Q
from django.core.servers.basehttp import FileWrapper

import os, json, datetime
import sendgrid, html2text

from mixes.models import Mix, Song, MixSong, Comment
from mixes.forms import PictureForm, SongForm


def get_audio_meta(file):
    file_type = ''
    if (settings.ENVIRONMENT != 'local'):
       # magic_object = magic.Magic()
        mime = magic.from_file(file, mime=True)
        if ('audio/mp4' in mime):
            file_type = 'm4a'
        elif ('audio/mpeg' in mime):
            file_type = 'mp3'
        else:
            file_type = 'unknown'
    else:
        file_type = 'mp3'

    if (file_type == 'mp3'):
        return EasyID3(file)
    elif (file_type == 'm4a'):
        return EasyMP4(file)
    else:
        return False


def jsonResponse(success, response={}):
    
    if (success is False):
        if ('error' not in response):
            response['error'] = 'General error.'
        response['success'] = False
    else:
        response['success'] = True

    return HttpResponse(json.dumps(response), mimetype='application/json')


def send_email(type, *args, **kwargs):
    s = sendgrid.Sendgrid(settings.SENDGRID['username'], settings.SENDGRID['password'], secure=True)

    if (settings.ENVIRONMENT == 'production'):
        email_list = User.objects.filter(~Q(email='')).values_list('email', flat=True)
    else:
        email_list = ["banfangled@yahoo.ca"]

    message_body = ''
    subject = ''
    if (type == 'mix_published'):

        t = loader.get_template('mixes/email/mix-published.html')
        c = Context({
            'user_name': kwargs['user_name'],
            'mix_title': kwargs['mix_title'],
            'mix_id': kwargs['mix_id']
        })
        message_body = t.render(c)
        subject = "New Mix!"

    elif (type == 'comment'):

        t = loader.get_template('mixes/email/comment.html')
        c = Context({
            'user_name': kwargs['user_name'],
            'mix_title': kwargs['mix_title'],
            'mix_id': kwargs['mix_id'],
            'comment': kwargs['comment']
        })
        message_body = t.render(c)
        subject = "Comment on " + kwargs['mix_title']

    if (message_body != ''):
        message = sendgrid.Message("mixmaster@mix-swap.com", subject,  html2text.html2text(message_body), message_body)
        message.add_to(email_list)

        # use the Web API to send your message
        s.web.send(message)


@login_required
def mix(request, pk):
    mix = get_object_or_404(Mix, pk=pk)
    is_user_mix = (mix.user == request.user)
    is_published = mix.is_published

    if (not is_published) and (not is_user_mix):
        raise Http404

    if ('HTTP_X_HTTP_METHOD_OVERRIDE' in request.META):
        data = json.loads(request.body)
        response = {}
        if request.META['HTTP_X_HTTP_METHOD_OVERRIDE'] == 'PATCH':
            if ('title' in data):
                mix.title = data['title']
                mix.save()

                response['title'] = data['title']

            if ('pictureFile' in data):
                delete_picture(request, pk, False)

            if ('isPublished' in data):
                mix.is_published = data['isPublished']
                if (mix.is_published and mix.date_published is None):
                    mix.date_published = datetime.datetime.now()
                mix.save()
                if ('sendEmail' in data):
                    send_email(
                        'mix_published',
                        user_name=request.user.first_name,
                        mix_title=mix.title,
                        mix_id=mix.id
                    )
            
            response['method'] = 'patch'

        return jsonResponse(True, response)

    else:
        picture_form = PictureForm()
        user = request.user
        if (user not in mix.user_listens.all()):
            mix.user_listens.add(user)

        return render(
            request,
            'mixes/mix.html',
            {
                'mix': mix,
                'user': user,
                'mix_songs': MixSong.objects.filter(mix=mix),
                'is_user_mix': is_user_mix,
                'picture_form': picture_form
            }
        )


@login_required
def new_mix(request):
    mix = Mix(
        user=request.user
    )
    mix.save()

    return jsonResponse(True, {'id': mix.id})


@login_required
def delete_mix(request, pk):
    try:
        mix = Mix.objects.get(pk=pk)
    except mix.DoesNotExist:
        return jsonResponse(False, {'error': 'No mix.'})

    if (mix.user != request.user):
        return jsonResponse(False, {'error': 'Bad user.'})

    Song.objects.filter(mix=mix).delete()
    Comment.objects.filter(mix=mix).delete()

    mix.delete()

    return jsonResponse(True)


@login_required
def update_song_order(request, pk):
    try:
        mix = Mix.objects.get(pk=pk, is_published=False)
    except mix.DoesNotExist:
        return jsonResponse(False, {'error': 'No mix.'})

    if (mix.user != request.user):
        return jsonResponse(False, {'error': 'Bad user.'})

    if ('HTTP_X_HTTP_METHOD_OVERRIDE' in request.META):

        data = json.loads(request.body)
        for data_song in data:
            song = Song.objects.get(pk=data_song['id'])
            mix_song = MixSong.objects.get(mix=mix, song=song)
            mix_song.song_order = data_song['songOrder']
            mix_song.save()

        return jsonResponse(True)

    else:
        return jsonResponse(False)


@login_required
def upload_song(request, pk):
    response = {}

    try:
        mix = Mix.objects.get(pk=pk, is_published=False)
    except mix.DoesNotExist:
        return jsonResponse(False, {'error': 'No mix.'})

    if (mix.user != request.user):
        return jsonResponse(False, {'error': 'Bad user.'})

    if request.method == 'POST':
        form = SongForm(request.POST, request.FILES)

        if form.is_valid():

            song_file = request.FILES['songfile']
            song = Song.create({
                'user': request.user,
                'mix': mix,
                'song_file': song_file
            })
            if (song is False):
                return jsonResponse(False, {'error': 'Bad file type.'})
            song.save()

            song_order = mix.songs.count() + 1

            mixSong = MixSong(
                mix=mix,
                song=song,
                song_order=song_order
            )
            mixSong.save()

            response['song_id'] = str(song.id)
            response['title'] = str(song.title)
            response['artist'] = str(song.artist)
            response['song_order'] = str(song_order)
            response['song_file'] = str(song.song_file.url)

        else:
            return jsonResponse(False, {'error': form.errors})

    else:
        return jsonResponse(False, {'error': 'No POST'})

    return jsonResponse(True, response)


@login_required
def update_song(request, pk, song_id):
    try:
        mix = Mix.objects.get(pk=pk)
        song = Song.objects.get(pk=song_id)
    except (mix.DoesNotExist, song.DoesNotExist):
        return jsonResponse(False, {'error': 'No mix or song.'})

    response = {}

    if ('HTTP_X_HTTP_METHOD_OVERRIDE' in request.META):
        if (request.META['HTTP_X_HTTP_METHOD_OVERRIDE'] == 'DELETE'):
            if (mix.user != request.user):
                return jsonResponse(False, {'error': 'Bad user.'})
            
            if (song.song_file):
                os.remove(settings.MEDIA_ROOT + str(song.song_file))
            song.delete()

        elif (request.META['HTTP_X_HTTP_METHOD_OVERRIDE'] == 'PATCH'):
            data = json.loads(request.body)
            if ('isUserFav' in data):
                mix_song = MixSong.objects.get(mix=mix, song=song)
                if (data['isUserFav']):
                    mix_song.favourites.add(request.user)
                else:
                    mix_song.favourites.remove(request.user)
                
                mix_song.save()
                response['total_fav'] = mix_song.favourites.count()

            elif ('title' in data):
                song.title = data['title']
                song.save(update_fields=['title'])

            elif ('artist' in data):
                song.artist = data['artist']
                song.save(update_fields=['artist'])

            return jsonResponse(True, response)

    return jsonResponse(True, {'hey': request.META['HTTP_X_HTTP_METHOD_OVERRIDE']})


@login_required
def upload_picture(request, pk):
    response = {}

    try:
        mix = Mix.objects.get(pk=pk, is_published=False)
    except mix.DoesNotExist:
        return jsonResponse(False, {'error': 'No mix.'})

    if (mix.user != request.user):
        return jsonResponse(False, {'error': 'Bad user.'})

    if request.method == 'POST':
        form = PictureForm(request.POST, request.FILES)

        if form.is_valid():
            delete_picture(request, pk, False)

            mix.picture_file = request.FILES['picfile']
            mix.save()

            response['file'] = str(mix.picture_file.url)
        else:
            return jsonResponse(False, {'error': form.errors})

    else:
        return jsonResponse(False, {'error': 'No post.'})

    return jsonResponse(True, response)


@login_required
def delete_picture(request, pk, return_http=True):
    try:
        mix = Mix.objects.get(pk=pk, is_published=False)

    except mix.DoesNotExist:
        if (return_http):
            return jsonResponse(False, {'error': 'No mix'})
        else:
            return False

    if (mix.user != request.user):
        return jsonResponse(False, {'error': 'Bad user.'})

    if (mix.picture_file != ''):
        try:
            os.remove(settings.MEDIA_ROOT + str(mix.picture_file))
        except OSError:
            pass
        mix.picture_file = ''
        mix.save()

    return True


@login_required
def add_comment(request, pk):
    try:
        mix = Mix.objects.get(pk=pk)

    except mix.DoesNotExist:
        return jsonResponse(False, {'error': 'No mix'})

    user = request.user
    data = json.loads(request.body)
    comment = Comment(
        user=user,
        mix=mix,
        text=data['text'],
        date=datetime.datetime.now()
    )
    comment.save()

    send_email(
        'comment',
        user_name=user.first_name,
        mix_title=mix.title,
        mix_id=mix.id,
        comment=data['text'].replace('\n', '<br />').replace('\r', '')
    )

    return jsonResponse(True)


@login_required
def get_comments(request, pk):
    try:
        mix = Mix.objects.get(pk=pk)

    except mix.DoesNotExist:
        return jsonResponse(False, {'error': 'No mix'})

    comments_set = mix.comment_set.all()
    comments = []
    for comment_item in comments_set:
        comment = {
            'id': comment_item.id,
            'date': str(comment_item.date),
            'username': comment_item.user.first_name,
            'text': comment_item.text.replace('\n', '<br>').replace('\r', ''),
            'mixId': mix.id
        }
        comments.append(comment)



    response = {
        'comments': comments
    }

    return jsonResponse(True, response)


@login_required
def download_mix(request, pk):
    mix = get_object_or_404(Mix, pk=pk)
    is_published = mix.is_published

    if (not is_published):
        raise Http404

    download_file = mix.get_download_file()

    response = HttpResponse(open(settings.MEDIA_ROOT + download_file.name.encode('ascii', 'ignore'), 'rb').read(), content_type='application/zip')
    response['Content-Disposition'] = 'attachment; filename=' + os.path.basename(download_file.name)
    response['Content-Length'] = os.path.getsize(settings.MEDIA_ROOT + download_file.name.encode('ascii', 'ignore'))
    return response
