from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from mixes.models import Mix
from django.db.models import Count, Sum, Avg


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

    mixes = Mix.objects.annotate(num_favs=Count('mixsong__favourites')).annotate(num_songs=Count('mixsong', distinct=True)).order_by('-num_favs', 'num_songs')[:10]

    return render(
        request,
        'home/top-favs.html',
        {
            'mixes': mixes
        }
    )
