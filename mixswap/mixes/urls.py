from django.conf.urls import patterns, url

from mixes import views

urlpatterns = patterns(
    '',
    url(r'^(?P<pk>\d+)/$', views.DetailView.as_view(), name='mix'),
)
