from django.urls import path
from .views import (
    StudentListCreateView, StudentDetailView, GuardianListCreateView,
    StudentSignupView, StudentMyGuardiansView,
    StudentVerifyOtpView, StudentResendOtpView,
    StudentPendingListView, StudentApproveView, StudentRejectView,
    StudentBulkImportView,
)

urlpatterns = [
    path('students/signup/',           StudentSignupView.as_view(),      name='student-signup'),
    path('students/verify-otp/',       StudentVerifyOtpView.as_view(),   name='student-verify-otp'),
    path('students/resend-otp/',       StudentResendOtpView.as_view(),   name='student-resend-otp'),
    path('students/pending/',          StudentPendingListView.as_view(), name='student-pending-list'),
    path('students/bulk-import/',      StudentBulkImportView.as_view(),  name='student-bulk-import'),
    path('students/<int:pk>/approve/', StudentApproveView.as_view(),     name='student-approve'),
    path('students/<int:pk>/reject/',  StudentRejectView.as_view(),      name='student-reject'),
    path('students/me/guardians/',     StudentMyGuardiansView.as_view(), name='student-my-guardians'),
    path('students/',                  StudentListCreateView.as_view(),  name='student-list'),
    path('students/<int:pk>/',         StudentDetailView.as_view(),      name='student-detail'),
    path('guardians/',                 GuardianListCreateView.as_view(), name='guardian-list'),
]