from django.urls import path
from .views import ComplaintListCreateView, ComplaintDetailView, ComplaintStatsView

urlpatterns = [
    path('complaints/', ComplaintListCreateView.as_view(), name='complaint-list'),
    path('complaints/<int:pk>/', ComplaintDetailView.as_view(), name='complaint-detail'),
    path('complaints/stats/', ComplaintStatsView.as_view(), name='complaint-stats'),
]
