from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.template import Context, loader
from django.contrib.auth.decorators import login_required
from django.utils import simplejson
from django.conf import settings

import os
import getpass

from mixes.models import Mix
from mixes.forms import PictureForm


@login_required
def mix(request, pk):
    mix = get_object_or_404(Mix, pk=pk)
    is_user_mix = mix.user == request.user
    picture_form = PictureForm()
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


def delete_picture(request, pk, return_http=True):
    try:
        mix = Mix.objects.get(pk=pk, is_published=False)

    except mix.DoesNotExist:
        if (return_http):
            response_dict = {}
            response_dict['success'] = False
            response_dict['error'] = 'No Mix.'
            return HttpResponse(simplejson.dumps(response_dict), mimetype='application/json')
        else:
            return False

    if (mix.picture_file):
        os.remove(str(mix.picture_file))
        mix.picture_file = ''
        mix.save()

    return True


def upload_picture(request, pk):
    response_dict = {}

    try:
        mix = Mix.objects.get(pk=pk, is_published=False)
    except mix.DoesNotExist:
        response_dict['success'] = False
        response_dict['error'] = 'No Mix.'
        return HttpResponse(simplejson.dumps(response_dict), mimetype='application/json')

    if request.method == 'POST':
        form = PictureForm(request.POST, request.FILES)

        if form.is_valid():
            if not delete_picture(request, pk, False):
                response_dict['success'] = False
                response_dict['error'] = 'Delete error.'
                return HttpResponse(simplejson.dumps(response_dict), mimetype='application/json')
            
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

    return HttpResponse(simplejson.dumps(response_dict), mimetype='application/json')
