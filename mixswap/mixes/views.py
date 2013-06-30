from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.template import Context, loader
from django.contrib.auth.decorators import login_required
from django.conf import settings

import os, json

from mixes.models import Mix, Song
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
                'is_user_mix': is_user_mix,
                'picture_form': picture_form
            }
        )


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

            mix.songs.add(song)
            mix.save()

            response['file'] = str(song.song_file)
            response['title'] = str(song.title)
            response['artist'] = str(song.artist)

        else:
            return jsonResponse(False, {'error': form.errors})

    else:
        return jsonResponse(False, {'error': 'No POST'})

    return jsonResponse(True, response)


def delete_song(request, pk, song_id, return_http=True):
    try:
        song = Song.objects.get(pk=song_id)

    except song.DoesNotExist:
        if (return_http):
            return jsonResponse({'error': 'No song'})
        else:
            return False

    if (song.song_file):
        os.remove(str(song.song_file))
    
    song.delete()

    return True


def update_song(request, pk, song_id, return_http=True):
    try:
        mix = Mix.objects.get(pk=pk, is_published=False)

    except mix.DoesNotExist:
        if (return_http):
            return jsonResponse({'error': 'No mix'})
        else:
            return False

    return True

    
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
