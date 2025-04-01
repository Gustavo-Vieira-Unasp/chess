from datetime import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponseNotAllowed
from django.urls import reverse
from .models import Tournament

def simple_tournament(request):
    tournaments = Tournament.objects.all().order_by('-id')
    return render(request, 'app_simple_tournament.html', {
        'tournaments': tournaments
    })

def create_tournament(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    tournament_name = request.POST.get("tournament_name")
    tournament_date = request.POST.get("tournament_date")

    if not tournament_name or tournament_name.strip() == "":
        return render(request, 'app_simple_tournament.html', {
            'tournaments': Tournament.objects.all(),
            'error': "O nome do torneio não pode estar vazio."
        })

    try:
        tournament_date = datetime.strptime(tournament_date, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return render(request, 'app_simple_tournament.html', {
            'tournaments': Tournament.objects.all(),
            'error': "Formato de data inválido. Por favor, selecione uma data válida."
        })

    if Tournament.objects.filter(name=tournament_name).exists():
        return render(request, 'app_simple_tournament.html', {
            'tournaments': Tournament.objects.all(),
            'error': "Já existe um torneio com este nome."
        })

    tournament = Tournament.objects.create(name=tournament_name, date=tournament_date)

    return redirect(reverse('simple_tournament'))

def delete_tournament(request, tournament_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    tournament = get_object_or_404(Tournament, id=tournament_id)
    tournament.delete()

    return redirect(reverse('simple_tournament'))

def page_simple_tournament(request, tournament_name):
    tournament = get_object_or_404(tournament, name__iexact=tournament_name)

    return render(request, 'page_simple_tournament.html', {'tournament': tournament})