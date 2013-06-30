from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.template import Context, loader
from django.contrib.auth.decorators import login_required
from django.conf import settings

import os, json

from mixes.models import Mix, Song, MixSong
from mixes.forms import PictureForm, SongForm


def jsonResponse(success, response={}):
    
    if (success is False):
        if ('error' not in response):
            response['error'] = 'General error.'
        response['success'] = False
    else:
        response['success'] = True

    return HttpResponse(json.dumps(response), mimetype='application/json')


@login_required
def mix(request, pk):
    mix = get_object_or_404(Mix, pk=pk)
    is_user_mix = mix.user == request.user
    picture_form = PictureForm()

    print("MIX!")

    if ('HTTP_X_HTTP_METHOD_OVERRIDE' in request.META):

        data = json.loads(request.body)
        response = {}
        if request.META['HTTP_X_HTTP_METHOD_OVERRIDE'] == 'PATCH':
            mix.title = data['title']
            mix.save()
            response['title'] = data['title']
            response['method'] = 'patch'

        return jsonResponse(True, response)

    else:
        return render(
            request,
            'mixes/mix.html',
            {
                'mix': mix,
                'user': mix.user,
                'mix_songs': MixSong.objects.filter(mix=mix),
                'is_user_mix': is_user_mix,
                'picture_form': picture_form
            }
        )


def update_song_order(request, pk):
    try:
        mix = Mix.objects.get(pk=pk, is_published=False)
    except mix.DoesNotExist:
        return jsonResponse({'error': 'No mix'})

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


def upload_song(request, pk):
    response = {}

    try:
        mix = Mix.objects.get(pk=pk, is_published=False)
    except mix.DoesNotExist:
        return jsonResponse({'error': 'No mix'})

    if request.method == 'POST':
        form = SongForm(request.POST, request.FILES)

        if form.is_valid():

            song_file = request.FILES['songfile']
            song = Song.create({
                'user': request.user,
                'mix': mix,
                'song_file': song_file
            })
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

        else:
            return jsonResponse(False, {'error': form.errors})

    else:
        return jsonResponse(False, {'error': 'No POST'})

    return jsonResponse(True, response)


def update_song(request, pk, song_id):
    try:
        mix = Mix.objects.get(pk=pk, is_published=False)
        song = Song.objects.get(pk=song_id)
    except (mix.DoesNotExist, song.DoesNotExist):
        return jsonResponse({'error': 'No mix or song.'})

    if ('HTTP_X_HTTP_METHOD_OVERRIDE' in request.META):
        if (request.META['HTTP_X_HTTP_METHOD_OVERRIDE'] == 'DELETE'):
            if (song.song_file):
                os.remove(str(song.song_file))
            song.delete()

        elif (request.META['HTTP_X_HTTP_METHOD_OVERRIDE'] == 'UPDATE'):
            #stuff
            return jsonResponse(True)

    return jsonResponse(True)

    
def upload_picture(request, pk):
    response_dict = {}

    try:
        mix = Mix.objects.get(pk=pk, is_published=False)
    except mix.DoesNotExist:
        return jsonResponse({'error': 'No mix'})

    if request.method == 'POST':
        form = PictureForm(request.POST, request.FILES)

        if form.is_valid():
            if not delete_picture(request, pk, False):
                response_dict['success'] = False
                response_dict['error'] = 'Delete error.'
                return HttpResponse(json.dumps(response_dict), mimetype='application/json')

            mix.picture_file = request.FILES['picfile']
            mix.save()

            response_dict['file'] = str(mix.picture_file)
            response_dict['success'] = True
        else:
            response_dict['success'] = False
            response_dict['error'] = form.errors

    else:
        response_dict['success'] = False
        response_dict['error'] = 'No Post.'

    return HttpResponse(json.dumps(response_dict), mimetype='application/json')


def delete_picture(request, pk, return_http=True):
    try:
        mix = Mix.objects.get(pk=pk, is_published=False)

    except mix.DoesNotExist:
        if (return_http):
            return jsonResponse({'error': 'No mix'})
        else:
            return False

    if (mix.picture_file):
        mix.picture_file = ''
        mix.save()
        os.remove(str(mix.picture_file))

    return True
