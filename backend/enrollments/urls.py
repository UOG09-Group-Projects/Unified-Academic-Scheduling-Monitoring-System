from django.urls import path
from .views import AvailableCoursesView, EnrollmentListView, EnrollmentDetailView

urlpatterns = [
    path('enrollments/available-courses/', AvailableCoursesView.as_view(), name='enrollment-available-courses'),
    path('enrollments/', EnrollmentListView.as_view(), name='enrollment-list'),
    path('enrollments/<int:pk>/', EnrollmentDetailView.as_view(), name='enrollment-detail'),
]
