from django.core.exceptions import ValidationError
from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseBadRequest
from .models import Tournament

def simple_tournament(request):
    """
    Renders the page where users can create a tournament.
    """
    return render(request, 'app_simple_tournament.html')

def create_tournament(request):
    """
    Handles the creation of a new tournament via a POST request.
    """
    if request.method == "POST":
        # Get the tournament name from the form data
        tournament_name = request.POST.get("tournament_name")

        # Validate the input
        if not tournament_name or tournament_name.strip() == "":
            return HttpResponseBadRequest("Tournament name cannot be empty.")

        # Check if a tournament with the same name already exists
        if Tournament.objects.filter(name=tournament_name).exists():
            return HttpResponseBadRequest("A tournament with this name already exists.")

        # Create the tournament
        Tournament.objects.create(name=tournament_name)
        return HttpResponse(f"Tournament '{tournament_name}' created successfully!")

    # Redirect to the homepage or another appropriate page for non-POST requests
    return redirect("home")