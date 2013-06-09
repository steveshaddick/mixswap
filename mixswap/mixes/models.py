from django.db import models
from django.contrib.auth.models import User


class Song(models.Model):
	user = models.ForeignKey(User)
	title = models.CharField(max_length=100)
	artist = models.CharField(max_length=100)
	song_prefix = models.CharField(max_length=50)
	date_uploaded = models.DateField()

	def __unicode__(self):
		return self.song_prefix


class Mix(models.Model):
	user = models.ForeignKey(User)
	title = models.CharField(max_length=50)
	picture_file = models.CharField(max_length=100, blank=True)
	date_published = models.DateField(blank=True, null=True)
	songs = models.ManyToManyField(Song)

	class Meta:
		verbose_name_plural = "mixes"

	def __unicode__(self):
		return self.title
