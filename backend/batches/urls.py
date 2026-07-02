from django.urls import path
from .views import BatchListCreateView, BatchDetailView

urlpatterns = [
    path('batches/', BatchListCreateView.as_view(), name='batch-list-create'),
    path('batches/<int:pk>/', BatchDetailView.as_view(), name='batch-detail'),
]