from django.urls import path
from .views import (
    EnrollmentListCreateView,
    EnrollmentDetailView,
    EnrollmentDropdownDataView,
)


urlpatterns = [
    path(
        'enrollments/',
        EnrollmentListCreateView.as_view(),
        name='enrollment-list'
    ),
    path(
        'enrollments/dropdown-data/',
        EnrollmentDropdownDataView.as_view(),
        name='enrollment-dropdown-data'
    ),
    path(
        'enrollments/<int:pk>/',
        EnrollmentDetailView.as_view(),
        name='enrollment-detail'
    ),
]