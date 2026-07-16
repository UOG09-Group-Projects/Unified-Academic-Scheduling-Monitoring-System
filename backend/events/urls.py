from django.urls import path
from .views import EventListView, EventDetailView, MyCoursesView

urlpatterns = [
    path('events/', EventListView.as_view(), name='event-list'),
    path('events/<int:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('my-courses/', MyCoursesView.as_view(), name='event-my-courses'),
]
