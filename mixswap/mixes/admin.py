from django.contrib import admin
from mixes.models import Mix, Song, MixSong, Comment

admin.site.register(Song)
admin.site.register(Mix)
admin.site.register(MixSong)
admin.site.register(Comment)
