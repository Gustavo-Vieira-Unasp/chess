from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.simple_tournament, name='simple_tournament'),
    path('create_tournament/', views.create_tournament, name="create_tournament"),
    path('tournament/<int:tournament_id>/delete/', views.delete_tournament, name='delete_tournament'),
    path('tournament/<int:tournament_id>/', views.tournament_detail, name='tournament_detail'),
    path('tournament/<int:tournament_id>/update_description/', views.update_tournament_description, name='update_tournament_description'),
    path('tournament/<int:tournament_id>/add_player/', views.add_player, name='add_player'),
    path('tournament/<int:tournament_id>/delete_player/<int:player_id>/', views.delete_player, name='delete_player'),
    path('tournament/<int:tournament_id>/players/bracket/', views.get_player_for_bracket, name='get_player_for_bracket'),
    path('tournament/<int:tournament_id>/generate_round/', views.generate_round_pairings, name='generate_round_pairings'),
    path('tournament/<int:tournament_id>/match/<int:match_id>/register_result/', views.register_match_result, name='register_match_result'),
]