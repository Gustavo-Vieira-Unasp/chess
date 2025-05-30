from datetime import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponseNotAllowed
from django.urls import reverse
from django.contrib import messages
from .models import Tournament, Player
from .forms import PlayerForm
from django.views.decorators.http import require_POST, require_http_methods
from django.http import JsonResponse
from django.forms.models import model_to_dict
import math

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
    tournament = get_object_or_404(Tournament, name__iexact=tournament_name)
    players = tournament.players.all()

    num_players = players.count()
    recommended_rounds = calculate_swiss_rounds(num_players)

    context = {
        'tournament' : tournament,
        'players' : players,
        'num_players' : num_players,
        'recommended_rounds' : recommended_rounds,
    }

    return render(request, 'page_simple_tournament.html', context)

def update_tournament_description(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    if request.method == "POST":
        new_description = request.POST.get("description", "").strip()
        tournament.description = new_description
        tournament.save()
        messages.success(request, "Descrição do torneio atualizada com sucesso!")
        return redirect("page_simple_tournament", tournament_name = tournament.name)
    return redirect("page_simple_tournament", tournament_name = tournament.name)

@require_POST
def add_player(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    
    player_form = PlayerForm(request.POST)

    if player_form.is_valid():
        player = player_form.save(commit=False)
        player.tournament = tournament
        player.save()
        update_players_count = Player.objects.filter(tournament=tournament).count()
        update_recomended_rounds = calculate_swiss_rounds(update_players_count)
        
        return JsonResponse({
            'success': True,
            'message': f"Jogador '{player.name}' adicionado com sucesso!",
            'player': {
                'id': player.id,
                'name': player.name,
                'rating': player.rating
            },
            'num_players' : update_players_count,
            'recommended_rounds' : update_recomended_rounds,
        }, status=200) # Status 200 OK
    else:
        errors = player_form.errors.as_json()
        return JsonResponse({
            'success': False,
            'message': "Erro ao adicionar jogador.",
            'errors': player_form.errors.as_json()
        }, status=400)
    
@require_POST
def delete_player(request, tournament_id, player_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    player = get_object_or_404(Player, tournament=tournament, id=player_id)

    try:
        player.delete()
        messages.success(request, f"Jogador '{player.name}' excluido com sucesso")
        return JsonResponse({"success": True, "message": f"Jogador '{player.name}' excluído com sucesso!"}, status=200)
    
    except Exception as e:
        messages.error(request, f"Erro ao excluir jogador: {e}")
        return JsonResponse({"success": False, "error": str(e)}, status=500)

def calculate_swiss_rounds(num_players):
    if num_players < 2:
        return 0
    return math.ceil(math.log2(num_players))