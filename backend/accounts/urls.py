from django.urls import path
from .views import profile_view, change_password_view

urlpatterns = [
    path('profile/', profile_view),
    path('profile/change-password/', change_password_view),
]