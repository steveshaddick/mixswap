from django.conf.urls import patterns, url

from mixes import views

urlpatterns = patterns(
    '',
    url(r'^(?P<pk>\d+)/$', views.mix, name='mix'),
    url(r'^(?P<pk>\d+)/delete/$', views.delete_mix, name='delete_mix'),
    url(r'^(?P<pk>\d+)/upload_picture/$', views.upload_picture, name='upload_picture'),
    url(r'^(?P<pk>\d+)/delete_picture/$', views.delete_picture, name='delete_picture'),
    url(r'^(?P<pk>\d+)/upload_song/$', views.upload_song, name='upload_song'),
    url(r'^(?P<pk>\d+)/update_song_order/$', views.update_song_order, name='update_song_order'),
    url(r'^(?P<pk>\d+)/song/(?P<song_id>\d+)/$', views.update_song, name='update_song'),
    url(r'^(?P<pk>\d+)/comment/$', views.add_comment, name='add_comment'),
    url(r'^(?P<pk>\d+)/download_mix/$', views.download_mix, name='download_mix'),
    url(r'^(?P<pk>\d+)/comments/$', views.get_comments, name='comments'),
    url(r'^new/$', views.new_mix, name='new_mix'),
)
