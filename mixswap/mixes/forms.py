from django import forms


class SongForm(forms.Form):
    songfile = forms.FileField(
        label='Select an audio track',
        help_text='max. 50 megabytes'
    )


class PictureForm(forms.Form):
    picfile = forms.ImageField(
        label='Select a picture',
        help_text='max. 5 megabytes'
    )
