from django.urls import path
from .views import ManagerListCreateView, ManagerDetailView

urlpatterns = [
    path("managers/", ManagerListCreateView.as_view(), name="manager-list-create"),
    path("managers/<int:pk>/", ManagerDetailView.as_view(), name="manager-detail"),
]