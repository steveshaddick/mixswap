from django.conf.urls import patterns, url

from home import views

urlpatterns = patterns(
    '',
    url(r'^$', views.home, name='home'),
    url(r'^top_favs/$', views.top_favs, name='top_favs'),
)
