from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render, redirect
from django.template import Context, loader
from django.contrib.auth.decorators import login_required

from mixes.models import Mix


@login_required
def mix(request, pk):
	mix = get_object_or_404(Mix, pk=pk)
	is_user_mix = mix.user == request.user
	return render(request, 'mixes/mix.html', {'mix': mix, 'is_user_mix': is_user_mix})
