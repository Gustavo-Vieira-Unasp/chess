from django.shortcuts import render, redirect
from django.http import HttpResponseNotAllowed
from django.urls import reverse
from .models import Tournament

def simple_tournament(request):
    # Query all tournaments from the database
    tournaments = Tournament.objects.all().order_by('-id')  # Order by latest first
    return render(request, 'app_simple_tournament.html', {
        'tournaments': tournaments
    })

def create_tournament(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    tournament_name = request.POST.get("tournament_name")

    # Validate the tournament name
    if not tournament_name or tournament_name.strip() == "":
        return render(request, 'app_simple_tournament.html', {
            'tournaments': Tournament.objects.all(),
            'error': "Tournament name cannot be empty."
        })

    if Tournament.objects.filter(name=tournament_name).exists():
        return render(request, 'app_simple_tournament.html', {
            'tournaments': Tournament.objects.all(),
            'error': "A tournament with this name already exists."
        })

    # Create the tournament
    tournament = Tournament.objects.create(name=tournament_name)

    # Redirect to the same page to display updated list
    return redirect(reverse('simple_tournament'))
