# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding M2M table for field favourites on 'MixSong'
        m2m_table_name = db.shorten_name(u'mixes_mixsong_favourites')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('mixsong', models.ForeignKey(orm[u'mixes.mixsong'], null=False)),
            ('user', models.ForeignKey(orm[u'auth.user'], null=False))
        ))
        db.create_unique(m2m_table_name, ['mixsong_id', 'user_id'])

        # Deleting field 'Song.song_prefix'
        db.delete_column(u'mixes_song', 'song_prefix')

        # Removing M2M table for field favourites on 'Song'
        db.delete_table(db.shorten_name(u'mixes_song_favourites'))


        # Changing field 'Song.date_uploaded'
        db.alter_column(u'mixes_song', 'date_uploaded', self.gf('django.db.models.fields.DateTimeField')())

    def backwards(self, orm):
        # Removing M2M table for field favourites on 'MixSong'
        db.delete_table(db.shorten_name(u'mixes_mixsong_favourites'))

        # Adding field 'Song.song_prefix'
        db.add_column(u'mixes_song', 'song_prefix',
                      self.gf('django.db.models.fields.CharField')(default='', max_length=100),
                      keep_default=False)

        # Adding M2M table for field favourites on 'Song'
        m2m_table_name = db.shorten_name(u'mixes_song_favourites')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('song', models.ForeignKey(orm[u'mixes.song'], null=False)),
            ('user', models.ForeignKey(orm[u'auth.user'], null=False))
        ))
        db.create_unique(m2m_table_name, ['song_id', 'user_id'])


        # Changing field 'Song.date_uploaded'
        db.alter_column(u'mixes_song', 'date_uploaded', self.gf('django.db.models.fields.DateField')())

    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'mixes.comment': {
            'Meta': {'object_name': 'Comment'},
            'date': ('django.db.models.fields.DateField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'mix': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['mixes.Mix']"}),
            'text': ('django.db.models.fields.TextField', [], {}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"})
        },
        u'mixes.mix': {
            'Meta': {'object_name': 'Mix'},
            'date_published': ('django.db.models.fields.DateField', [], {'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_published': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'picture_file': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'songs': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['mixes.Song']", 'null': 'True', 'through': u"orm['mixes.MixSong']", 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"})
        },
        u'mixes.mixsong': {
            'Meta': {'ordering': "('song_order',)", 'object_name': 'MixSong'},
            'favourites': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'fav+'", 'null': 'True', 'symmetrical': 'False', 'to': u"orm['auth.User']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'mix': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['mixes.Mix']"}),
            'song': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['mixes.Song']"}),
            'song_order': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'})
        },
        u'mixes.song': {
            'Meta': {'object_name': 'Song'},
            'artist': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'date_uploaded': ('django.db.models.fields.DateTimeField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'primary_mix': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'primary+'", 'to': u"orm['mixes.Mix']"}),
            'song_file': ('django.db.models.fields.files.FileField', [], {'default': "'file'", 'max_length': '100'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"})
        }
    }

    complete_apps = ['mixes']