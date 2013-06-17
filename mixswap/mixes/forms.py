from django import forms


class PictureForm(forms.Form):
    picfile = forms.ImageField(
        label='Select a picture',
        help_text='max. 5 megabytes'
    )
