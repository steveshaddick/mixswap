from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
import os


def get_upload_path(instance, filename):
    return os.path.join(settings.MEDIA_ROOT, "user_%d" % instance.user.id, "photos", filename)


class Song(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length=100)
    artist = models.CharField(max_length=100)
    song_prefix = models.CharField(max_length=50)
    favourites = models.ManyToManyField(User, related_name='fav+', blank=True, null=True)
    date_uploaded = models.DateField()

    def __unicode__(self):
        return self.song_prefix


class Mix(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length=50)
    picture_file = models.ImageField(upload_to=get_upload_path, blank=True, null=True)
    is_published = models.BooleanField()
    date_published = models.DateField(blank=True, null=True)
    songs = models.ManyToManyField(Song, blank=True, null=True)

    class Meta:
        verbose_name_plural = "mixes"

    def __unicode__(self):
        return self.title


class Comment(models.Model):
    user = models.ForeignKey(User)
    mix = models.ForeignKey(Mix)
    date = models.DateField()
    text = models.TextField()

    def __unicode__(self):
        return str(self.mix.id) + '_' + str(self.id)
