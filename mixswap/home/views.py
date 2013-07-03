from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from mixes.models import Mix


@login_required
def home(request):
    user = request.user
    user_mixes = Mix.objects.filter(user=user).order_by('-id')
    mixes = Mix.objects.filter(is_published=True).order_by('-date_published')

    return render(
        request,
        'home/home.html',
        {
            'user': user,
            'user_mixes': user_mixes,
            'all_mixes': mixes,
        }
    )


@login_required
def top_favs(request):
    user = request.user

    return render(
        request,
        'home/top-favs.html',
        {
            'user': user,
        }
    )
