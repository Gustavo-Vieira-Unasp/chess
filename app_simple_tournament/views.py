from datetime import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponseNotAllowed
from django.urls import reverse
from django.contrib import messages
from .models import Tournament, Player, Match
from .forms import PlayerForm
from django.views.decorators.http import require_POST, require_http_methods, require_GET
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.forms.models import model_to_dict
import math
import json
import random

def calculate_swiss_rounds(num_players):
    if num_players < 2:
        return 0
    return math.ceil(math.log2(num_players))

def simple_tournament(request):
    tournaments = Tournament.objects.all().order_by('-id')
    context = {'tournaments' : tournaments}
    return render(request, 'app_simple_tournament.html', context)

@require_POST
@csrf_exempt
def create_tournament(request):
    tournament_name = request.POST.get("tournament_name")
    tournament_date_str = request.POST.get("tournament_date")
    tournament_description = request.POST.get("tournament_description")

    if not tournament_name:
        return JsonResponse({'error': 'O nome do torneio não pode ser vazio.'}, status=400)
    
    tournament_date = None
    if tournament_date_str:
        try:
            tournament_date = datetime.strptime(tournament_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return JsonResponse({'error': 'Formato de data inválido. Por favor, use AAAA-MM-DD.'}, status=400)

    if Tournament.objects.filter(name__iexact=tournament_name).exists():
        return JsonResponse({'error': f"Já existe um torneio com o nome '{tournament_name}'."}, status=400)

    try:
        tournament = Tournament.objects.create(
            name=tournament_name, 
            date=tournament_date,
            description=tournament_description
        )
        return JsonResponse({
            'message': f"Torneio '{tournament.name}' criado com sucesso.",
            'tournament': {
                'id': tournament.id,
                'name': tournament.name,
                'date': tournament.date.strftime('%Y-%m-%d') if tournament.date else None,
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': f'Ocorreu um erro interno: {str(e)}'}, status=500)

@require_POST
@csrf_exempt
def delete_tournament(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    tournament_name = tournament.name
    tournament.delete()
    messages.success(request, f"Torneio '{tournament_name}' excluído com sucesso.")
    return redirect(reverse('simple_tournament'))

def tournament_detail(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    players = tournament.players.all()

    num_players = players.count()
    recommended_rounds = calculate_swiss_rounds(num_players)

    current_round_number = 0
    last_match = Match.objects.filter(tournament=tournament).order_by('-round_number').first()
    if last_match:
        current_round_number = last_match.round_number

    matches_to_display = []
    if current_round_number > 0:
        matches_to_display = Match.objects.filter(
            tournament=tournament,
            round_number=current_round_number
        ).order_by('pk')
    
    context = {
        'tournament': tournament,
        'players': players,
        'num_players': num_players,
        'recommended_rounds': recommended_rounds,
        'current_round_number': current_round_number,
        'matches_to_display': matches_to_display,
    }
    return render(request, 'page_simple_tournament', context)

@require_POST
@csrf_exempt
def update_tournament_description(request, tournament_id):
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            tournament = get_object_or_404(Tournament, pk=tournament_id)
            data = json.loads(request.body)
            new_description = data.get('description', '').strip()

            tournament.description = new_description
            tournament.save()
        
        except Exception as e:
            print(f"Erro ao atualizar descrição: {e}")
            return JsonResponse({'success': False, 'error': f'Erro interno do servidor: {e}'}, status=500)
    return JsonResponse({
        'success': False, 
        'error': 'Requisição inválida.'
    }, status=400)

@require_POST
@csrf_exempt
def add_player(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    
    player_form = PlayerForm(request.POST)

    if player_form.is_valid():
        player = player_form.save(commit=False)
        player.tournament = tournament
        try:
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
            }, status=200)
        except Exception as e:
            return JsonResponse({
                'success' : False,
                'message' : "Erro ao adicionar jogador",
                'errors' : {'name': [f"Já existe um jogador com este nome no torneio. Erro: {str(e)}"]},
            }, status=400)
    else:
        errors = player_form.errors.as_json()
        return JsonResponse({
            'success': False,
            'message': "Erro ao adicionar jogador.",
            'errors': player_form.errors.as_json()
        }, status=400)
    

@require_POST
@csrf_exempt
def delete_player(request, tournament_id, player_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)
    player = get_object_or_404(Player, tournament=tournament, pk=player_id)

    try:
        player.delete()
        update_players_count = Player.objects.filter(tournament=tournament).count()
        update_recommended_rounds = calculate_swiss_rounds(update_players_count)

        return JsonResponse({
            "success": True, 
            "message": f"Jogador '{player.name}' excluído com sucesso!",
            'num_players' : update_players_count,
            'recommended_rounds' : update_recommended_rounds,
        }, status=200)
    
    except Exception as e:
        return JsonResponse({
            "success": False,                  
            "error": str(e)}, 
        status=500)

def get_player_for_bracket(request, tournament_id):
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            tournament = get_object_or_404(Tournament, pk=tournament_id)
            players = tournament.players.all().order_by('-score', 'name')

            player_data = []
            for player in players:
                player_data.append({
                    'id': player.id,
                    'name': player.name,
                    'score': player.score,
                    'games_as_white': player.games_as_white,
                    'games_as_black': player.games_as_whiyte,
                })

            return JsonResponse({'players': player_data})
        except Exception as e:
            print(f"Erro na view get_player_for_bracket: {e}")
            return JsonResponse({'error': f'Erro interno do servidor: {e}'}, status=500)
    return JsonResponse({'error': 'Requisição inválida.'}, status=400)

@require_POST
@csrf_exempt
def generate_round_pairings(request, tournament_id):
    if request.headers.get('X-Requested-With') == 'XLMHttpsRequest':
        try:
            tournament = get_object_or_404(Tournament, pk=tournament_id)
            last_match = Match.objects.filter(tournament=tournament).order_by('-round_number').first()
            current_round_number = (last_match.round_number + 1) if last_match else 1

            players = list(tournament.players.all().order_by('-score', 'name'))

            if len(players) < 2:
                return JsonResponse({
                    'success': False,
                    'message': "É preciso ter pelo menos dois jogadores para gerar partidas."
                })
            
            existing_unplayed_matches = Match.objects.filter(
                tournament=tournament,
                round_number=current_round_number,
                result='N'
            ).exists()

            if existing_unplayed_matches:
                return JsonResponse({
                    'success': False,
                    'messages': f'Já existem partidas pendentes para a rodada, {current_round_number}. Registre os resultados antes de gerar a próxima rodada.'
                }, status=400)
            
            player_with_bye = None
            if len(players) % 2 != 0:
                eligible_for_bye = [p for p in players if not Match.objects.filter(tournament=tournament, player_white=p, result='BYE').exists()]

                if eligible_for_bye:
                    eligible_for_bye.sort(key=lambda p: (p.score, p.name))
                    player_with_bye = eligible_for_bye[0]
                
                else:
                    player_with_bye = players[-1]

                players.remove(player_with_bye)

                Match.objects.create(
                    tournament=tournament,
                    round_number=current_round_number,
                    player_white=player_with_bye,
                    player_black=None,
                    result='BYE'
                )
                print(f"BYE para {player_with_bye.name} na Rodada {current_round_number}")

            scores = sorted(list(set([p.score for p in players] for score in scores)))
            grouped_players = {score: [p for p in players if p.score == score] for score in scores}

            for score in grouped_players:
                random.shuffle(grouped_players[score])

            available_players = []
            for score in scores:
                available_players.extend(grouped_players[score])

            pairings = []

            while len(available_players) >= 2:
                player1 = available_players.pop(0)

                best_opponent = None
                best_opponent_index = -1

                for i, player2 in enumerate(available_players):
                    has_played_against = Match.objects.filter(
                        tournament=tournament,
                        round_number__lt=current_round_number,
                        player_white__in=[player1, player2],
                        player_black__in=[player1, player2]
                    ).exists()

                    if has_played_against:
                        continue

                    best_opponent = player2
                    best_opponent_index = i
                    break

                if best_opponent:
                    available_players.pop(best_opponent_index)

                    white_player, black_player = None, None

                    p1_color_balance = player1.games_as_white - player1.games_as_black
                    p2_color_balance = best_opponent.games_as_white - best_opponent.games_as_black

                    if p1_color_balance <= p2_color_balance:
                        white_player = player1
                        black_player = best_opponent
                    
                    else:
                        white_player = best_opponent
                        black_player = player1

                    if white_player.games_as_white >= 2 and (white_player.games_as_white - white_player.games_as_black > 0):
                        if white_player == player1 and p2_color_balance < p1_color_balance:
                            white_player, black_player == best_opponent, player1
                        elif white_player == best_opponent and p1_color_balance < p2_color_balance:
                            white_player, black_player == player1, best_opponent

                    if black_player.games_as_black >= 2 and (black_player.games_as_black - black_player.games_as_black > 0):
                        if black_player == player1 and p2_color_balance > p1_color_balance:
                            white_player, black_player = player1, best_opponent
                        elif black_player == best_opponent and p1_color_balance > p2_color_balance:
                            white_player, black_player == best_opponent, player1

                    if not white_player or not black_player or white_player == black_player:
                        if random.random() < 0.5:
                            white_player, black_player = player1, best_opponent
                        else: 
                            white_player, black_player = best_opponent, player1
                    
                    match = Match.objects.create(
                        tournament=tournament,
                        round_number=current_round_number,
                        player_white=white_player,
                        player_black=black_player,
                        result='N'
                    )
                    pairings.append({
                        'match_id': match.id,
                        'player_white_id': white_player.id,
                        'player_white_name': white_player.name,
                        'player_black_id': black_player.id,
                        'player_black_name': black_player.name,
                    })
                else:
                    print(f"Aviso: Jogador {player1.name} não conseguiu encontrar um oponente elegível na Rodada {current_round_number}.")
                    pass

            return JsonResponse({
                'success': True, 
                'round_number': current_round_number, 
                'pairings': pairings
            })
        
        except Exception as e:
            print(f"Erro ao gerar emparelhamentos: {e}")
            return JsonResponse({
                'success': False, 
                'error': f'Erro interno do servidor: {e}'
            }, status=500)
    return JsonResponse({
        'success': False, 
        'error': 'Requisição inválida.'
    }, status=400)

@require_POST
@csrf_exempt
def register_match_result(request, tournament_id, match_id):
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            match = get_object_or_404(Match, pk=match_id, tournament_id=tournament_id)
            
            data = json.loads(request.body)
            new_result = data.get('result')

            if new_result not in ['W', 'B', 'D', 'BYE']:
                return JsonResponse({'success': False, 'error': 'Resultado inválido.'}, status=400)
            
            old_result = match.result 
            
            if old_result == new_result:
                return JsonResponse({'success': True, 'message': 'O resultado já está registrado.'})

            match.result = new_result
            match.save()

            match.update_player_scores(old_result=old_result) 

            updated_players_data = []
            if match.player_white:
                match.player_white.refresh_from_db() 
                updated_players_data.append({
                    'id': match.player_white.id,
                    'name': match.player_white.name,
                    'score': match.player_white.score,
                    'games_as_white': match.player_white.games_as_white,
                    'games_as_black': match.player_white.games_as_black,
                })
            if match.player_black:
                match.player_black.refresh_from_db()
                updated_players_data.append({
                    'id': match.player_black.id,
                    'name': match.player_black.name,
                    'score': match.player_black.score,
                    'games_as_white': match.player_black.games_as_white,
                    'games_as_black': match.player_black.games_as_black,
                })
            
            if match.result == 'BYE' and match.player_white and not match.player_black:
                match.player_white.refresh_from_db()
                updated_players_data = [{
                    'id': match.player_white.id,
                    'name': match.player_white.name,
                    'score': match.player_white.score,
                    'games_as_white': match.player_white.games_as_white,
                    'games_as_black': match.player_white.games_as_black,
                }]


            return JsonResponse({
                'success': True, 
                'message': 'Resultado registrado com sucesso!', 
                'updated_players': updated_players_data
            })

        except Exception as e:
            print(f"Erro ao registrar resultado da partida para Match ID {match_id}: {e}")
            return JsonResponse({
                'success': False, 
                'error': f'Erro interno do servidor: {e}'
            }, status=500)
    return JsonResponse({
        'success': False, 
        'error': 'Requisição inválida.'
    }, status=400)