from django.db import models

class Tournament(models.Model):
    name = models.CharField(max_length=250, unique=True)
    date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Player(models.Model):
    name = models.CharField(max_length=150)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='players')

    def __str__(self):
        return f"{self.name} (Tournament: {self.tournament.name})"


class Match(models.Model):
    players = models.ManyToManyField(Player, related_name='matches')
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')

    def __str__(self):
        player_names = ", ".join([player.name for player in self.players.all()])
        return f"Match: {player_names}"


class AllMatches(models.Model):
    """A collection of matches, optionally tied to a tournament."""
    name = models.CharField(max_length=250)
    matches = models.ManyToManyField(Match, related_name='collections', blank=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='match_collections', null=True, blank=True)

    def list_matches(self):
        return [match.__str__() for match in self.matches.all()]

    def __str__(self):
        return f"AllMatches: {self.name}"