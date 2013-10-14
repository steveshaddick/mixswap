from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from mutagen.easymp4 import EasyMP4
from mutagen.easyid3 import EasyID3

import magic
import os, re, time, datetime, zipfile, zlib


def get_photo_upload_path(instance, filename):
    return os.path.join("user_%d" % instance.user.id, "photos", "{0}_{1}{2}".format(instance.user.id, int(time.time()), os.path.splitext(filename.lower())[1]))


def get_audio_upload_path(instance, filename):
    pattern = re.compile('[^a-zA-z0-9.]+')
    return os.path.join("user_%d" % instance.user.id, "audio", "mix_%d" % instance.primary_mix.id, pattern.sub('', filename.lower()))

def get_zipfile_path(instance, filename):
    pattern = re.compile('[^a-zA-z0-9.]+')
    return os.path.join("user_%d" % instance.user.id, "downloads", pattern.sub('_', filename))


def get_audio_meta(file):
    file_type = ''
    if (settings.ENVIRONMENT != 'local'):
       # magic_object = magic.Magic()
        mime = magic.from_file(file, mime=True)
        if ('audio/mp4' in mime):
            file_type = 'm4a'
        elif ('audio/mpeg' in mime):
            file_type = 'mp3'
        else:
            file_type = 'mp3'
    else:
        file_type = 'mp3'

    if (file_type == 'mp3'):
        return EasyID3(file)
    elif (file_type == 'm4a'):
        return EasyMP4(file)
    else:
        return False


class Mix(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(default='New Mix', max_length=100)
    picture_file = models.ImageField(upload_to=get_photo_upload_path, blank=True, null=True)
    is_published = models.BooleanField()
    date_published = models.DateField(default=None, blank=True, null=True)
    songs = models.ManyToManyField('Song', through='MixSong', blank=True, null=True)
    user_listens = models.ManyToManyField(User, related_name='listens+')
    download_file = models.FileField(upload_to=get_zipfile_path, max_length=200, default=None, blank=True)

    class Meta:
        verbose_name_plural = "mixes"

    def __unicode__(self):
        return self.title

    def get_download_file(self):

        if (self.download_file != ''):
            return self.download_file

        mixsongs = MixSong.objects.filter(mix_id=self.id).order_by('song_order')

        pattern = re.compile('[^a-zA-z0-9.]+')
        zipfile_name = "user_%d" % self.user.id + "/downloads" + "/" + pattern.sub('_', self.title + '.zip') 
        
        if (zipfile_name == '.zip'):
            zipfile_name = '_.zip'
   
        directory = os.path.join(settings.MEDIA_ROOT, "user_%d" % self.user.id, "downloads")
        if not os.path.exists(directory):
            os.makedirs(directory)
        
        archive = zipfile.ZipFile(settings.MEDIA_ROOT + zipfile_name, 'w', compression=zipfile.ZIP_DEFLATED)

        added_file = False
        length = len(mixsongs)
        for mixsong in mixsongs:
            
            meta_data = get_audio_meta(settings.MEDIA_ROOT + mixsong.song.song_file.name.encode('ascii', 'ignore'))
            if (meta_data is not False):
                meta_data['album'] = self.title
                meta_data['tracknumber'] = unicode(str(mixsong.song_order) + '/' + str(length))
                meta_data.save()

            archive.write(settings.MEDIA_ROOT + mixsong.song.song_file.name.encode('ascii', 'ignore'), arcname=os.path.basename(mixsong.song.song_file.name), compress_type=zipfile.ZIP_DEFLATED)
            added_file = True
        
        archive.close()

        if (added_file):
            self.download_file = zipfile_name
            self.save()

            return self.download_file
        
        else:
            return ''


class Song(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length=100)
    artist = models.CharField(max_length=100)
    primary_mix = models.ForeignKey(Mix, related_name='primary+')
    song_file = models.FileField(upload_to=get_audio_upload_path, max_length=200, default='file')
    date_uploaded = models.DateTimeField()

    def __unicode__(self):
        return self.title + '_' + self.artist

    def save(self, *args, **kwargs):
        if ('update_fields' in kwargs):
            if ('title' in kwargs['update_fields']):
                meta_data = get_audio_meta(settings.MEDIA_ROOT + self.song_file.name.encode('ascii', 'ignore'))
                if (meta_data is not False):
                    meta_data['title'] = self.title
                    meta_data.save()
            
            elif ('artist' in kwargs['update_fields']):
                meta_data = get_audio_meta(settings.MEDIA_ROOT + self.song_file.name.encode('ascii', 'ignore'))
                if (meta_data is not False):
                    meta_data['artist'] = self.artist
                    meta_data.save()

        super(Song, self).save(*args, **kwargs)

    @classmethod
    def create(cls, params):
        meta_data = get_audio_meta(params['song_file'].temporary_file_path())
        if (meta_data is False):
            return False
        
        title = meta_data['title'][0].encode('ascii', 'ignore')
        artist = meta_data['artist'][0].encode('ascii', 'ignore')

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
    listens = models.PositiveIntegerField(default=0)

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
