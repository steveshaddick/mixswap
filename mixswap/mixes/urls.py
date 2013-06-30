from django.conf.urls import patterns, url

from mixes import views

urlpatterns = patterns(
    '',
    url(r'^(?P<pk>\d+)/$', views.mix, name='mix'),
    url(r'^(?P<pk>\d+)/upload_picture/$', views.upload_picture, name='upload_picture'),
    url(r'^(?P<pk>\d+)/delete_picture/$', views.delete_picture, name='delete_picture'),
    url(r'^(?P<pk>\d+)/upload_song/$', views.upload_song, name='upload_song'),
    url(r'^(?P<pk>\d+)/song/(?P<song_id>\d+)/delete$', views.delete_song, name='delete_song'),
    url(r'^(?P<pk>\d+)/song/(?P<song_id>\d+)/update$', views.update_song, name='update_song'),
)
