from django.shortcuts import render
from django.http import HttpResponse

def simple_tournament(request):
    return render(request, 'app_simple_tournament.html')