from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('home/', include('app_home.urls')),
    path('simple_tournament/', include('app_simple_tournament.urls')),
]
