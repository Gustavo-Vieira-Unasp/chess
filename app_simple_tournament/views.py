from datetime import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponseNotAllowed
from django.urls import reverse
from django.contrib import messages
from .models import Tournament, Player, Match
from .forms import PlayerForm
from django.views.decorators.http import require_POST, require_http_methods, require_GET
from django.views.decorators.csrf import csrf_exempt # Temporariamente para depuração, remova em produção!
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
@csrf_exempt # Considere remover isso em produção e usar o token CSRF no JS
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
@csrf_exempt # Considere remover isso em produção
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
    return render(request, 'page_simple_tournament.html', context)

@require_POST
@csrf_exempt # Considere remover isso em produção
def update_tournament_description(request, tournament_id):
    tournament = get_object_or_404(Tournament, pk=tournament_id)

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            new_description = request.POST.get('description', '').strip()

            tournament.description = new_description
            tournament.save()

            return JsonResponse({
                'success': True,
                'description': tournament.description,
            }, status=200)
        
        except Exception as e:
            print(f"Erro ao atualizar descrição: {e}")
            return JsonResponse({
                'success': False, 
                'error': f'Erro interno do servidor: {e}'
            }, status=500)
    return JsonResponse({
        'success': False, 
        'error': 'Requisição inválida.'
    }, status=400)

@require_POST
@csrf_exempt # Considere remover isso em produção
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
                    'score': player.score
                },
                'num_players': update_players_count,
                'recommended_rounds': update_recomended_rounds,
            }, status=200)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': "Erro ao adicionar jogador",
                'errors': {'name': [f"Já existe um jogador com este nome no torneio. Erro: {str(e)}"]},
            }, status=400)
    else:
        # Usar player_form.errors.as_json() diretamente
        return JsonResponse({
            'success': False,
            'message': "Erro ao adicionar jogador.",
            'errors': player_form.errors.as_json()
        }, status=400)    

@require_POST
@csrf_exempt # Considere remover isso em produção
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
    if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'error': 'Requisição inválida.'
        }, status=400)
    try:
        tournament = get_object_or_404(Tournament, pk=tournament_id)
        players = tournament.players.all().order_by('name')

        player_data = []
        for player in players:
            player_data.append({
                'id': player.id,
                'name': player.name,
                'score': player.score,
                'games_as_white': player.games_as_white,
                'games_as_black': player.games_as_black,
            })

        return JsonResponse({'players': player_data})
    except Tournament.DoesNotExist:
        return JsonResponse({
            'error': 'Torneio não encontrado.'
        }, status=404)
    except Exception as e:
        print(f"Erro na view get_player_for_bracket: {e}")
        return JsonResponse({
            'error': f'Erro interno do servidor: {str(e)}'
        }, status=500)

@require_POST
@csrf_exempt # Considere remover isso em produção
def generate_round_pairings(request, tournament_id):
    # CORREÇÃO: Erro de digitação 'XLMHttpsRequest' para 'XMLHttpRequest'
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            tournament = get_object_or_404(Tournament, pk=tournament_id)
            
            # Determina o número da próxima rodada
            last_match = Match.objects.filter(tournament=tournament).order_by('-round_number').first()
            current_round_number = (last_match.round_number + 1) if last_match else 1

            players = list(tournament.players.all().order_by('-score', 'name'))

            if len(players) < 2:
                return JsonResponse({
                    'success': False,
                    'message': "É preciso ter pelo menos dois jogadores para gerar partidas."
                }, status=400) # Adicionado status 400

            # Verifica se já existem partidas não jogadas para a rodada atual
            existing_unplayed_matches = Match.objects.filter(
                tournament=tournament,
                round_number=current_round_number,
                result='N'
            ).exists()

            if existing_unplayed_matches:
                # CORREÇÃO: Consistência no nome da chave 'message' (singular)
                return JsonResponse({
                    'success': False,
                    'message': f'Já existem partidas pendentes para a rodada {current_round_number}. Registre os resultados antes de gerar a próxima rodada.'
                }, status=400)
            
            player_with_bye = None
            if len(players) % 2 != 0:
                # Lógica para BYE: tenta encontrar alguém que ainda não teve BYE, senão o último na lista (menor score/nome)
                eligible_for_bye = [p for p in players if not Match.objects.filter(
                                        tournament=tournament, 
                                        player_white=p, 
                                        result='BYE'
                                    ).exists()]

                if eligible_for_bye:
                    # Dá o BYE para o jogador com menor score (e depois por nome) que ainda não teve BYE
                    eligible_for_bye.sort(key=lambda p: (p.score, p.name))
                    player_with_bye = eligible_for_bye[0]
                else:
                    # Se todos já tiveram BYE, dá para o último (menor score/nome)
                    player_with_bye = players[-1]

                players.remove(player_with_bye)

                # Cria a partida de BYE
                Match.objects.create(
                    tournament=tournament,
                    round_number=current_round_number,
                    player_white=player_with_bye,
                    player_black=None, # Indicativo de BYE
                    result='BYE' # Resultado automático para BYE
                )
                print(f"BYE para {player_with_bye.name} na Rodada {current_round_number}")

            # CORREÇÃO: Correção na lógica de extração e ordenação dos scores
            scores = sorted(list(set([p.score for p in players])), reverse=True)
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
                    # Verifica se já jogaram contra nesta ou em rodadas anteriores
                    has_played_against = Match.objects.filter(
                        tournament=tournament,
                        player_white__in=[player1, player2],
                        player_black__in=[player1, player2]
                    ).exists()

                    if has_played_against:
                        continue # Pula este oponente se já jogaram

                    best_opponent = player2
                    best_opponent_index = i
                    break # Encontrou um oponente elegível, pare de procurar
                
                if best_opponent:
                    available_players.pop(best_opponent_index)

                    # Lógica para balanceamento de cores
                    # O jogador com menos jogos de branco (ou mais de preto) geralmente joga de branco
                    white_player, black_player = player1, best_opponent # Default
                    
                    p1_color_balance = player1.games_as_white - player1.games_as_black
                    p2_color_balance = best_opponent.games_as_white - best_opponent.games_as_black

                    if p1_color_balance > p2_color_balance: # P1 jogou mais de branco, P2 deve ser branco
                        white_player, black_player = best_opponent, player1
                    elif p2_color_balance > p1_color_balance: # P2 jogou mais de branco, P1 deve ser branco
                        white_player, black_player = player1, best_opponent
                    else: # Balanceados ou nunca jogaram, randomize
                        if random.random() < 0.5:
                            white_player, black_player = player1, best_opponent
                        else:
                            white_player, black_player = best_opponent, player1
                            
                    # Crie a partida
                    match = Match.objects.create(
                        tournament=tournament,
                        round_number=current_round_number,
                        player_white=white_player,
                        player_black=black_player,
                        result='N' # 'N' para Não Jogada
                    )
                    pairings.append({
                        'match_id': match.id,
                        'player_white_id': white_player.id,
                        'player_white_name': white_player.name,
                        'player_black_id': black_player.id,
                        'player_black_name': black_player.name,
                        'is_bye_match': False # Indica que não é uma partida BYE
                    })
                else:
                    # Se um player1 não encontrar oponente, ele precisa ser tratado.
                    # Para depuração, você pode querer adicionar ele de volta ou logar um aviso mais forte.
                    # Em um sistema suíço completo, isso indicaria um problema no algoritmo ou necessidade de BYE tardio.
                    print(f"Aviso: Jogador {player1.name} não conseguiu encontrar um oponente elegível na Rodada {current_round_number}. Não foi pareado.")
                    # Opcional: Se for um problema de pareamento, ele deveria ser adicionado de volta à lista ou emparelhado com alguém do próximo grupo.
                    # Por enquanto, ele é simplesmente descartado do loop (o que pode não ser o comportamento desejado para um torneio suíço robusto).
                    pass

            # Adiciona o BYE à lista de pairings para retornar ao frontend, se houver
            if player_with_bye:
                # Busca a partida de BYE recém-criada
                bye_match = Match.objects.get(
                    tournament=tournament, 
                    round_number=current_round_number, 
                    player_white=player_with_bye, 
                    result='BYE'
                )
                pairings.append({
                    'match_id': bye_match.id, # ID da partida de BYE
                    'player_white_id': player_with_bye.id,
                    'player_white_name': player_with_bye.name,
                    'player_black_id': None,
                    'player_black_name': 'BYE',
                    'is_bye_match': True,
                })
            
            return JsonResponse({
                'success': True, 
                'message': 'Partidas geradas com sucesso para a Rodada {}!'.format(current_round_number),
                'round_number': current_round_number, 
                'pairings': pairings
            })
            
        except Tournament.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Torneio não encontrado.'}, status=404)
        except Exception as e:
            print(f"Erro ao gerar emparelhamentos (Rodada Suíça): {e}")
            return JsonResponse({
                'success': False, 
                'error': f'Erro interno do servidor: {e}'
            }, status=500)
    # Se a requisição não for AJAX, retorna erro
    return JsonResponse({
        'success': False, 
        'error': 'Requisição inválida.'
    }, status=400)

@require_POST
@csrf_exempt # Considere remover isso em produção
def generate_random_pairings(request, tournament_id):
    if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'error': 'Requisição inválida'
        }, status=400)
    
    try:
        tournament = get_object_or_404(Tournament, pk=tournament_id)

        all_players = list(tournament.players.all())

        if len(all_players) < 2:
            return JsonResponse({
                'success': False,
                'message': 'É necessário no mínimo 2 jogadores para gerar partidas'
            }, status=400)
        
        random.shuffle(all_players)

        pairings_data = []

        # Limpa todas as partidas existentes para este torneio antes de gerar novas
        # CUIDADO: Esta linha vai apagar TODO o histórico de partidas do torneio,
        # o que pode não ser o desejado se você estiver gerando rodadas sucessivas.
        # Se for apenas para a primeira rodada aleatória, talvez seja ok,
        # mas se a intenção é rodadas subsequentes, isso deve ser ajustado.
        Match.objects.filter(tournament=tournament).delete() 

        current_round_number = 1 # Para pareamento aleatório, sempre começa da rodada 1

        bye_player_info = None

        if len(all_players) % 2 != 0:
            bye_player = all_players.pop()

            match_bye = Match.objects.create(
                tournament=tournament,
                round_number=current_round_number,
                player_white=bye_player,
                player_black=None,
                result='BYE'
            )
            bye_player_info = {'id': bye_player.id, 'name': bye_player.name}
            
            # Adicione o BYE à lista de pairings_data imediatamente após a criação
            pairings_data.append({
                'id': match_bye.id,
                'player_white_id': bye_player_info['id'],
                'player_white_name': bye_player_info['name'],
                'player_black_id': None,
                'player_black_name': 'BYE', # Para exibir no frontend
                'round_number': current_round_number,
                'is_bye_match': True,
            })

        for i in range(0, len(all_players), 2):
            player_white = all_players[i]
            player_black = all_players[i+1]

            match = Match.objects.create(
                tournament=tournament,
                round_number=current_round_number,
                player_white=player_white,
                player_black=player_black,
                result='N' # 'N' para Não Jogada
            )

            pairings_data.append({
                'id': match.id,
                'player_white_id': player_white.id,
                'player_white_name': player_white.name,
                'player_black_id': player_black.id,
                'player_black_name': player_black.name,
                'round_number': current_round_number,
                'is_bye_match': False,
            })

        message = f"Geradas {len([p for p in pairings_data if not p.get('is_bye_match')])} partidas aleatórias para a Rodada {current_round_number}."
        if bye_player_info:
            message += f" {bye_player_info['name']} ficou de 'Bye' nesta rodada."
        
        return JsonResponse({
            'success': True,
            'message': message,
            'pairings': pairings_data,
            'bye_player': bye_player_info,
        }, status=200)
    
    except Tournament.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Torneio não encontrado'
        }, status=404)    
    
    except Exception as e:
        print(f"Erro no backend ao gerar pareamentos aleatórios: {e}") 
        return JsonResponse({'success': False, 'error': f'Erro interno do servidor: {str(e)}'}, status=500)
    
@require_POST
def register_match_result(request, tournament_id, match_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        match = Match.objects.get(id=match_id, tournament=tournament)

        # Receber o resultado do corpo JSON
        data = json.loads(request.body)
        result = data.get('result')

        if result not in ['W', 'B', 'D']: # W: White, B: Black, D: Draw
            return JsonResponse({'success': False, 'error': 'Resultado inválido.'}, status=400)

        match.result = result
        match.save()

        # Lógica para atualizar scores dos jogadores
        # Exemplo:
        updated_players_data = []
        if result == 'W':
            match.player_white.score += 1 # Exemplo
            match.player_white.save()
            updated_players_data.append({'id': match.player_white.id, 'score': match.player_white.score})
        elif result == 'B':
            match.player_black.score += 1 # Exemplo
            match.player_black.save()
            updated_players_data.append({'id': match.player_black.id, 'score': match.player_black.score})
        elif result == 'D':
            match.player_white.score += 0.5 # Exemplo
            match.player_black.score += 0.5 # Exemplo
            match.player_white.save()
            match.player_black.save()
            updated_players_data.append({'id': match.player_white.id, 'score': match.player_white.score})
            updated_players_data.append({'id': match.player_black.id, 'score': match.player.black.score})

        return JsonResponse({
            'success': True,
            'message': 'Resultado registrado com sucesso!',
            'result_code': result,
            'player_white_name': match.player_white.name,
            'player_black_name': match.player_black.name,
            'updated_players': updated_players_data # Retorne os scores atualizados
        })

    except Tournament.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Torneio não encontrado.'}, status=404)
    except Match.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Partida não encontrada.'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Requisição JSON inválida.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Erro interno do servidor: {str(e)}'}, status=500)
