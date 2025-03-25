from django.shortcuts import render
from django.http import HttpResponse

def simple_tournament(request):
    return HttpResponse('simple_tournament')
