from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.simple_tournament, name='simple_tournament'),
    path('create_tournament/', views.create_tournament, name="create_tournament"),
    path('delete/<int:tournament_id>', views.delete_tournament, name='delete_tournament'),
    path('tournament/<str:tournament_name>', views.page_simple_tournament, name='page_simple_tournament'),
    path('tournament/<int:tournament_id>/update_description/', views.update_tournament_description, name='update_tournament_description'),
    path('tournament/<int:tournament_id>/add_player/', views.add_player, name='add_player'),
    path('tournament/<int:tournament_id>/delete_player/<int:player_id>/', views.delete_player, name='delete_player')
]