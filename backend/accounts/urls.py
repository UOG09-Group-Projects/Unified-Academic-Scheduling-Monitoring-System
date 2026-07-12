from django.urls import path
from .views import profile_view, profile_picture_view, change_password_view

urlpatterns = [
    path('profile/', profile_view),
    path('profile/picture/', profile_picture_view),
    path('profile/change-password/', change_password_view),
]
