from django.contrib import admin
from mixes.models import Mix, Song, Comment

admin.site.register(Song)
admin.site.register(Mix)
admin.site.register(Comment)
