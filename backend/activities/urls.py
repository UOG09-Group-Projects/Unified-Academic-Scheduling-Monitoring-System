from django.urls import path
from .views import CourseActivitiesView, ActivityDetailView, StudentProgressView, CourseRosterView

urlpatterns = [
    path('activities/course-roster/', CourseRosterView.as_view(), name='activity-course-roster'),
    path('activities/', CourseActivitiesView.as_view(), name='activity-list-create'),
    path('activities/<int:pk>/', ActivityDetailView.as_view(), name='activity-detail'),
    path('progress/', StudentProgressView.as_view(), name='progress-list-set'),
]
