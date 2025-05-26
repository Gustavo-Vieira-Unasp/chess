from django import forms
from .models import Player

class PlayerForm(forms.ModelForm):
    class Meta:
        model = Player
        fields = ['name'] 

        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Nome do jogador', 'class': 'player-name-input'}),
        }