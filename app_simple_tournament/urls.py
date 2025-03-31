from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.simple_tournament, name='simple_tournament'),
    path('create_tournament/', views.create_tournament, name="create_tournament"),
    path('delete/<int:tournament_id>', views.delete_tournament, name='delete_tournament'),
]
