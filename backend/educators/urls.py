from django.urls import path
from .views import EducatorListCreateView, EducatorDetailView

urlpatterns = [
    path('educators/', EducatorListCreateView.as_view(), name='educator-list-create'),
    path('educators/<int:pk>/', EducatorDetailView.as_view(), name='educator-detail'),
]
