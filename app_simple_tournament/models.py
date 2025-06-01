from django.db import models

class Tournament(models.Model):
    name = models.CharField(max_length=200, unique=True)
    date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Player(models.Model):
    name = models.CharField(max_length=150)
    score = models.FloatField(default=0.0) 
    tournament = models.ForeignKey(Tournament, related_name='players', on_delete=models.CASCADE)
    games_as_white = models.IntegerField(default=0)
    games_as_black = models.IntegerField(default=0)

    class Meta:
        ordering = ['-score', 'name']
        unique_together = ('tournament', 'name')

    def __str__(self):
        return f"{self.name} ({self.score} pts)"


class Match(models.Model):
    tournament = models.ForeignKey(Tournament, related_name='matches', on_delete=models.CASCADE)
    round_number = models.IntegerField()
    player_white = models.ForeignKey(Player, related_name='matches_as_white', on_delete=models.CASCADE, null=True, blank=True)
    player_black = models.ForeignKey(Player, related_name='matches_as_black', on_delete=models.CASCADE, null=True, blank=True)

    RESULT_CHOICES = [
        ('W', 'White Wins'), ('B', 'Black Wins'), ('D', 'Draw'),
        ('BYE', 'Bye'), ('N', 'Not Played')
    ]
    result = models.CharField(max_length=3, choices=RESULT_CHOICES, default='N')

    match_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('tournament', 'round_number', 'player_white', 'player_black')
        ordering = ['round_number', 'match_date']

    def __str__(self):
        if self.player_white and self.player_black:
            return f"Rodada {self.round_number}: {self.player_white.name} (Brancas) vs {self.player_black.name} - {self.get_result_display()}"
        elif self.player_white and self.result == 'BYE':
            return f"Rodada {self.round_number}: {self.player_white.name} (BYE)"
        else:
            return f"Rodada {self.round_number}: Partida incompleta/pendente"
        
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            if self.player_white:
                self.player_white.games_as_white = (self.player_white.games_as_white or 0) + 1
                self.player_white.save(update_fields=['games_as_white'])
            if self.player_black:
                self.player_black.games_as_black = (self.player_black.games_as_black or 0) + 1
                self.player_black.save(update_fields=['games_as_black'])
        super().save(*args, **kwargs)

    def update_player_scores(self, old_result=None):
        score_change_white = 0.0
        score_change_black = 0.0

        if old_result:
            if old_result == 'W': score_change_white -= 1.0
            elif old_result == 'B': score_change_white -=1.0
            elif old_result == 'D': score_change_white -= 0.5; score_change_black -= 0.5
            elif old_result == 'BYE': score_change_white -= 1.0
        
        if self.result == 'W': score_change_white += 1.0
        elif self.result == 'B': score_change_white -=1.0
        elif self.result == 'D': score_change_white -= 0.5; score_change_black -= 0.5
        elif self.result == 'BYE': score_change_white -= 1.0

        if self.player_white:
            self.player_white.score += score_change_white
            self.player_white.score = max(0.0, self.player_white.score)
            self.player_white.save(update_fields=['score'])
        
        if self.player_black:
            self.player_black.score += score_change_black
            self.player_black.score = max(0.0, self.player_black.score)
            self.player_black.save(update_fields=['score'])



class AllMatches(models.Model):
    """A collection of matches, optionally tied to a tournament."""
    name = models.CharField(max_length=250)
    matches = models.ManyToManyField(Match, related_name='collections', blank=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='match_collections', null=True, blank=True)

    def list_matches(self):
        return [match.__str__() for match in self.matches.all()]

    def __str__(self):
        return f"AllMatches: {self.name}"