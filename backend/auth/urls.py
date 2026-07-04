from django.urls import path
from .views import (
    login_view,
    refresh_view,
    me_view,
    verify_email_view,
    forgot_password_view,
    reset_password_view,
    create_user_view,
)


urlpatterns = [
    path('login/', login_view),
    path('refresh/', refresh_view),
    path('me/', me_view),
    path('verify-email/', verify_email_view),
    path('forgot-password/', forgot_password_view),
    path('reset-password/', reset_password_view),
    path('create-user/', create_user_view),
 
]