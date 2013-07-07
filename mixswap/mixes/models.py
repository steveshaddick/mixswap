from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from mutagen.easymp4 import EasyMP4
from mutagen.easyid3 import EasyID3

#from mutagen.easyid3 import EasyID3
import os, re, time, datetime


def get_photo_upload_path(instance, filename):
    return os.path.join("user_%d" % instance.user.id, "photos", "{0}_{1}{2}".format(instance.user.id, int(time.time()), os.path.splitext(filename)[1]))


def get_audio_upload_path(instance, filename):
    pattern = re.compile('[^a-zA-z0-9.]+')
    return os.path.join("user_%d" % instance.user.id, "audio", "mix_%d" % instance.primary_mix.id, pattern.sub('', filename))


class Mix(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(default='New Mix', max_length=50)
    picture_file = models.ImageField(upload_to=get_photo_upload_path, blank=True, null=True)
    is_published = models.BooleanField()
    date_published = models.DateField(default=None, blank=True, null=True)
    songs = models.ManyToManyField('Song', through='MixSong', blank=True, null=True)

    class Meta:
        verbose_name_plural = "mixes"

    def __unicode__(self):
        return self.title


class Song(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length=100)
    artist = models.CharField(max_length=100)
    primary_mix = models.ForeignKey(Mix, related_name='primary+')
    song_file = models.FileField(upload_to=get_audio_upload_path, default='file')
    date_uploaded = models.DateTimeField()

    def __unicode__(self):
        return self.title + '_' + self.artist

    @classmethod
    def create(cls, params):
        file_type = ''
        if (settings.ENVIRONMENT != 'local'):
            magic_object = magic.Magic()
            mime = magic_object.from_file(params['song_file'].temporary_file_path(), mime=True)
            if ('audio/mp4a' in mime):
                file_type = 'm4a'
            elif ('audio/mpeg' in mime):
                file_type = 'mp3'
            else:
                file_type = 'unknown'
        else:
            file_type = 'mp3'

        if (file_type == 'mp3'):
            metaData = EasyID3(params['song_file'].temporary_file_path())
        elif (file_type == 'm4a'):
            metaData = EasyMP4(params['song_file'].temporary_file_path())
        else:
            return False
        
        title = metaData['title'][0].encode('ascii', 'ignore')
        artist = metaData['artist'][0].encode('ascii', 'ignore')

        song = cls(
            user=params['user'],
            title=title,
            artist=artist,
            primary_mix=params['mix'],
            song_file=params['song_file'],
            date_uploaded=datetime.datetime.now()
        )
        return song


class MixSong(models.Model):
    mix = models.ForeignKey(Mix)
    song = models.ForeignKey(Song)
    song_order = models.PositiveIntegerField(default=1)
    favourites = models.ManyToManyField(User, related_name='fav+', blank=True, null=True)

    def __unicode__(self):
        return self.song.title + '_' + self.song.artist

    class Meta:
        ordering = ('song_order',)


class Comment(models.Model):
    user = models.ForeignKey(User)
    mix = models.ForeignKey(Mix)
    date = models.DateTimeField()
    text = models.TextField()

    def __unicode__(self):
        return str(self.mix.id) + '_' + str(self.id)
