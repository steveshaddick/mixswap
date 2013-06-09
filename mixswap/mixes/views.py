from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.template import Context, loader
from django.views import generic

from mixes.models import Mix


class DetailView(generic.DetailView):
	template_name = 'mixes/mix.html'
	model = Mix
