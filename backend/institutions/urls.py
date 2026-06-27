from django.urls import path
from .views import InstitutionListCreateView, InstitutionDetailView

urlpatterns = [
    path('', InstitutionListCreateView.as_view(), name='institution-list-create'),
    path('<int:pk>/', InstitutionDetailView.as_view(), name='institution-detail'),
]