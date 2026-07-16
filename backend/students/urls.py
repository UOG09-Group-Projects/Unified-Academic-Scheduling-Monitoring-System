from django.urls import path
from .views import (
    StudentListCreateView, StudentDetailView, GuardianListCreateView,
    StudentSignupView, StudentMyGuardiansView,
)

urlpatterns = [
    path('students/signup/',       StudentSignupView.as_view(),     name='student-signup'),
    path('students/me/guardians/', StudentMyGuardiansView.as_view(), name='student-my-guardians'),
    path('students/',              StudentListCreateView.as_view(), name='student-list'),
    path('students/<int:pk>/',     StudentDetailView.as_view(),     name='student-detail'),
    path('guardians/',             GuardianListCreateView.as_view(), name='guardian-list'),
]