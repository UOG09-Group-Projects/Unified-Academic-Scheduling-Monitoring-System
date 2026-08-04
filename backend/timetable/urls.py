from django.urls import path
from .views import TimetableSlotListCreateView, TimetableSlotDetailView

urlpatterns = [
    path('slots/', TimetableSlotListCreateView.as_view(), name='timetable-slot-list-create'),
    path('slots/<int:pk>/', TimetableSlotDetailView.as_view(), name='timetable-slot-detail'),
]
