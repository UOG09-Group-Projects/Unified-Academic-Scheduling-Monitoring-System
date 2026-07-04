from django.urls import path
from .views import StudentListCreateView, StudentDetailView, GuardianListCreateView

urlpatterns = [
    path('students/',              StudentListCreateView.as_view(), name='student-list'),
    path('students/<int:pk>/',     StudentDetailView.as_view(),     name='student-detail'),
    path('guardians/',             GuardianListCreateView.as_view(), name='guardian-list'),
]