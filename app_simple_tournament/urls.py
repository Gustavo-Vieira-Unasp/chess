from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.simple_tournament, name='simple_tournament'),
]
